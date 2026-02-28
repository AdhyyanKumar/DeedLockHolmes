const express = require('express');
const router = express.Router();
const crypto = require("crypto");
const multer = require("multer");
const solanaService = require('../services/solana.service');
const snowflakeService = require('../services/snowflake.service');
const geminiService = require('../services/gemini.service');
const { requireAuth } = require("../auth");
const { hashFile } = require("../utils/hash");

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/properties - Get all properties
router.get('/', async (req, res) => {
  try {
    const analyticsRows = await snowflakeService.listPropertyAnalytics(100);
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
    const propertyId = crypto.randomUUID();
    const ownerId = req.user.sub || req.user.email;
    const salePrice = 0;

    console.log('Registering property:', propertyId);

    const fraudAnalysis = await geminiService.detectFraudRisk({
      propertyId,
      address: propertyAddress,
      ownerName,
      salePrice
    });

    const blockchainResult = await solanaService.registerOnChain({
      deedHash,
      propertyAddress,
      ownerName,
      confidence: Math.max(0, 100 - Number(fraudAnalysis.riskScore || 0)),
      fraudRisk: Number(fraudAnalysis.riskScore || 0)
    });

    await snowflakeService.storePropertyRecord({
      propertyId,
      address: propertyAddress,
      ownerId,
      ownerName,
      deedHash,
      salePrice,
      transactionSignature: blockchainResult.txSig,
      timestamp: Date.now()
    });

    await snowflakeService.storeAIAnalysis(
      propertyId,
      'FRAUD_RISK',
      fraudAnalysis,
      fraudAnalysis.riskScore
    );

    await snowflakeService.insertPropertyAnalytics({
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
      message: 'Property registered successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/properties/:id/analyze - Get AI analysis
router.get('/:id/analyze', async (req, res) => {
  try {
    // Get property from blockchain
    const property = await solanaService.getProperty(req.params.id);
    
    // Get transaction history from Snowflake
    const history = await snowflakeService.getTransactionHistory(req.params.id);
    
    // Generate AI analysis
    const analysis = await geminiService.analyzeProperty(property, history);
    
    // Store analysis in Snowflake
    await snowflakeService.storeAIAnalysis(
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
    const results = await snowflakeService.searchProperties(req.params.term);
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
