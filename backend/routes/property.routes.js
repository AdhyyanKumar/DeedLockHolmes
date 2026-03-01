const express = require('express');
const router = express.Router();
const crypto = require("crypto");
const multer = require("multer");
const solanaService = require('../services/solana.service');
const mongoService = require('../services/mongo.service');
const geminiService = require('../services/gemini.service');
const emailService = require('../services/email.service');
const { requireAuth } = require("../auth");
const { hashFile } = require("../utils/hash");

const upload = multer({ storage: multer.memoryStorage() });

function mapRegistrationError(error) {
  const message = String(error?.message || "Registration failed.");
  if (/api[_\s-]*key[_\s-]*invalid|api key not valid/i.test(message)) {
    return "AI verification is misconfigured on the backend (invalid Gemini key).";
  }
  if (/resource_exhausted|quota|too many requests|429/i.test(message)) {
    return "AI verification is temporarily unavailable due to provider quota limits. Please retry shortly.";
  }
  if (/fetch failed|timed out|network/i.test(message)) {
    return "AI verification service is temporarily unreachable. Please retry.";
  }
  return message;
}

function shouldBlockBlockchainRegistration(fraudAnalysis) {
  const recommendation = String(fraudAnalysis?.recommendation || "").toUpperCase();
  const riskScore = Number(fraudAnalysis?.riskScore || 0);
  const riskLevel = String(fraudAnalysis?.riskLevel || "").toUpperCase();
  const threshold = Number(process.env.AI_BLOCK_RISK_THRESHOLD || 90);

  if (recommendation === "REJECT") {
    return {
      blocked: true,
      reason: "AI marked this deed as fraudulent (REJECT).",
    };
  }

  if (riskLevel === "HIGH" && riskScore >= threshold) {
    return {
      blocked: true,
      reason: `AI risk score ${riskScore} exceeds blocking threshold ${threshold}.`,
    };
  }

  return { blocked: false, reason: "" };
}

// GET /api/properties - Get all properties
router.get('/', async (req, res) => {
  try {
    const analyticsRows = await mongoService.listPropertyAnalytics(100);
    const properties = analyticsRows.map((row) => ({
      id: row.ID,
      address: row.PROPERTY_ADDRESS,
      owner: row.OWNER_NAME,
      confidenceScore: Number(row.GEMINI_CONFIDENCE ?? 0),
      fraudRisk:
        Number(row.FRAUD_RISK ?? 0) >= 80
          ? "High"
          : Number(row.FRAUD_RISK ?? 0) >= 50
            ? "Medium"
            : "Low",
      timestamp: new Date(row.CREATED_AT).toISOString(),
      accountAddress: row.PROPERTY_PDA,
      explorerUrl: `https://explorer.solana.com/tx/${row.TX_SIGNATURE}?cluster=devnet`,
      transferCount: 0,
    }));

    res.json({ 
      success: true, 
      count: properties.length,
      data: properties 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/properties/mine - Get properties registered by current user
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const analyticsRows = await mongoService.listPropertyAnalyticsByUser(
      {
        provider: req.user.provider,
        provider_user_id: req.user.sub,
        email: req.user.email,
      },
      200
    );

    const properties = analyticsRows.map((row) => ({
      id: row.ID,
      address: row.PROPERTY_ADDRESS,
      owner: row.OWNER_NAME,
      confidenceScore: Number(row.GEMINI_CONFIDENCE ?? 0),
      fraudRisk:
        Number(row.FRAUD_RISK ?? 0) >= 80
          ? "High"
          : Number(row.FRAUD_RISK ?? 0) >= 50
            ? "Medium"
            : "Low",
      timestamp: new Date(row.CREATED_AT).toISOString(),
      accountAddress: row.PROPERTY_PDA,
      explorerUrl: `https://explorer.solana.com/tx/${row.TX_SIGNATURE}?cluster=devnet`,
      transferCount: 0,
    }));

    res.json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/properties/:id - Get property by ID
router.get('/:id', async (req, res) => {
  try {
    const property = await solanaService.getProperty(req.params.id);
    res.json({ 
      success: true, 
      data: property 
    });
  } catch (error) {
    res.status(404).json({ 
      success: false, 
      error: 'Property not found' 
    });
  }
});

// POST /api/properties/register - Register new property
router.post('/register', requireAuth, upload.single("deed"), async (req, res) => {
  try {
    const propertyAddress = req.body.property_address || req.body.address || "";
    const ownerName = req.body.owner_name || req.body.ownerName || "";

    if (!propertyAddress || !ownerName || !req.file) {
      return res.status(400).json({
        success: false,
        error: 'Missing deed file, property address, or owner name'
      });
    }

    const deedHash = hashFile(req.file.buffer);
    const propertyId = crypto.randomUUID().replace(/-/g, ""); // 32-char compact UUID fits Solana's 32-byte seed limit
    const ownerId = req.user.sub || req.user.email;
    const salePrice = Math.max(1, Number(req.body.sale_price) || 1);
    const history = await mongoService.getTransactionHistory(propertyId).catch(() => []);

    console.log('Registering property:', propertyId);

    const fraudAnalysis = await geminiService.analyzeDeedForFraud(
      req.file.buffer,
      {
        propertyId,
        address: propertyAddress,
        ownerName,
        salePrice,
        deedHash,
      },
      history
    );

    const blockDecision = shouldBlockBlockchainRegistration(fraudAnalysis);
    if (blockDecision.blocked) {
      await mongoService.storeAIAnalysis(
        propertyId,
        'FRAUD_RISK_BLOCKED',
        fraudAnalysis,
        fraudAnalysis.riskScore
      );

      return res.status(422).json({
        success: false,
        error: `Fraudulent deed found. Not adding to blockchain. ${blockDecision.reason}`,
        fraudAnalysis,
      });
    }

    const blockchainResult = await solanaService.registerOnChain({
      propertyId,
      address: propertyAddress,
      ownerId,
      ownerName,
      deedHash,
      salePrice,
    });

    await mongoService.storePropertyRecord({
      propertyId,
      address: propertyAddress,
      ownerId,
      ownerName,
      deedHash,
      salePrice,
      transactionSignature: blockchainResult.txSig,
      timestamp: Date.now()
    });

    await mongoService.storeAIAnalysis(
      propertyId,
      'FRAUD_RISK',
      fraudAnalysis,
      fraudAnalysis.riskScore
    );

    await mongoService.insertPropertyAnalytics({
      id: propertyId,
      property_address: propertyAddress,
      owner_name: ownerName,
      deed_hash: deedHash,
      gemini_confidence: Math.max(0, 100 - Number(fraudAnalysis.riskScore || 0)),
      fraud_risk: Number(fraudAnalysis.riskScore || 0),
      tx_signature: blockchainResult.txSig,
      property_pda: blockchainResult.propertyPda,
      notes: fraudAnalysis.analysis,
      registered_by_provider: req.user.provider,
      registered_by_provider_user_id: req.user.sub,
      registered_by_email: req.user.email,
      registered_by_name: req.user.name,
    });

    res.json({
      success: true,
      property: {
        id: propertyId,
        address: propertyAddress,
        owner: ownerName,
        confidenceScore: Math.max(0, 100 - Number(fraudAnalysis.riskScore || 0)),
        fraudRisk:
          Number(fraudAnalysis.riskScore || 0) >= 80
            ? "High"
            : Number(fraudAnalysis.riskScore || 0) >= 50
              ? "Medium"
              : "Low",
        timestamp: new Date().toISOString(),
        accountAddress: blockchainResult.propertyPda,
        explorerUrl: blockchainResult.explorerUrl,
        transferCount: 0,
        analysis: fraudAnalysis.analysis || null,
        factors: Array.isArray(fraudAnalysis.factors) ? fraudAnalysis.factors : [],
        recommendation: fraudAnalysis.recommendation || null,
      },
      blockchain: blockchainResult,
      fraudAnalysis,
      deedAnalysisMethod: fraudAnalysis.method,
      deedExtraction: fraudAnalysis.extraction || null,
      message: 'Property registered successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    const safeMessage = mapRegistrationError(error);
    res.status(500).json({ 
      success: false, 
      error: safeMessage
    });
  }
});

// POST /api/properties/:id/transfer - Transfer property to new owner
router.post('/:id/transfer', requireAuth, async (req, res) => {
  try {
    const propertyId = req.params.id;
    const { buyerName, buyerEmail, salePrice } = req.body;

    if (!buyerName || !buyerEmail) {
      return res.status(400).json({ success: false, error: 'Buyer name and email are required.' });
    }

    const existing = await mongoService.findPropertyAnalyticsById(propertyId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Property not found.' });
    }

    const isOwner =
      existing.REGISTERED_BY_EMAIL === req.user.email ||
      existing.REGISTERED_BY_PROVIDER_USER_ID === req.user.sub;

    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'You do not own this property.' });
    }

    const newSalePrice = Math.max(1, Number(salePrice) || 1);
    const previousOwnerName = existing.OWNER_NAME;

    const blockchainResult = await solanaService.transferOnChain({
      propertyId,
      newOwnerId: buyerEmail,
      newOwnerName: buyerName,
      newDeedHash: existing.DEED_HASH || 'transfer',
      newSalePrice,
      previousOwnerName,
    });

    await mongoService.updatePropertyOwner(propertyId, {
      newOwnerName: buyerName,
      newOwnerEmail: buyerEmail,
      previousOwnerName,
      txSignature: blockchainResult.txSig,
    });

    await mongoService.storePropertyRecord({
      propertyId,
      address: existing.PROPERTY_ADDRESS,
      ownerId: buyerEmail,
      ownerName: buyerName,
      deedHash: existing.DEED_HASH || 'transfer',
      salePrice: newSalePrice,
      transactionSignature: blockchainResult.txSig,
      timestamp: Date.now(),
    });

    const transferCount = (Number(existing.TRANSFER_COUNT) || 0) + 1;

    // Send confirmation email to buyer (non-fatal)
    emailService.sendTransferConfirmation({
      buyerEmail,
      buyerName,
      propertyAddress: existing.PROPERTY_ADDRESS,
      previousOwner: previousOwnerName,
      explorerUrl: blockchainResult.explorerUrl,
      transferCount,
    }).catch((err) => console.error("Email send failed (non-fatal):", err.message));

    res.json({
      success: true,
      property: {
        id: propertyId,
        address: existing.PROPERTY_ADDRESS,
        owner: buyerName,
        previousOwner: previousOwnerName,
        confidenceScore: Number(existing.GEMINI_CONFIDENCE || 0),
        fraudRisk:
          Number(existing.FRAUD_RISK || 0) >= 80 ? 'High' :
          Number(existing.FRAUD_RISK || 0) >= 50 ? 'Medium' : 'Low',
        timestamp: new Date().toISOString(),
        accountAddress: blockchainResult.propertyPda || existing.PROPERTY_PDA || null,
        explorerUrl: blockchainResult.explorerUrl,
        transferCount,
      },
      blockchain: blockchainResult,
      message: 'Property transferred successfully',
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/properties/:id/analyze - Get AI analysis
router.get('/:id/analyze', async (req, res) => {
  try {
    // Get property from blockchain
    const property = await solanaService.getProperty(req.params.id);
    
    // Get transaction history from MongoDB
    const history = await mongoService.getTransactionHistory(req.params.id);
    
    // Generate AI analysis
    const analysis = await geminiService.analyzeProperty(property, history);
    
    // Store analysis in MongoDB
    await mongoService.storeAIAnalysis(
      req.params.id,
      'PRICE_ANALYSIS',
      analysis
    );
    
    res.json({
      success: true,
      property: property,
      transactionCount: history.length,
      analysis: analysis
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/properties/search/:term - Search properties
router.get('/search/:term', async (req, res) => {
  try {
    const results = await mongoService.searchProperties(req.params.term);
    res.json({ 
      success: true, 
      count: results.length,
      data: results 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;

