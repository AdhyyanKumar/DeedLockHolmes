const express = require('express');
const router = express.Router();
const crypto = require("crypto");
const multer = require("multer");
const solanaService = require('../services/solana.service');
const mongoService = require('../services/mongo.service');
const geminiService = require('../services/gemini.service');
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

    let blockchainResult = { txSig: null, propertyPda: null, explorerUrl: null };
    try {
      blockchainResult = await solanaService.registerOnChain({
        propertyId,
        address: propertyAddress,
        ownerId,
        ownerName,
        deedHash,
        salePrice,
      });
    } catch (chainErr) {
      console.warn('On-chain registration skipped (program unavailable):', chainErr.message);
    }

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
        transferCount: 0
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

