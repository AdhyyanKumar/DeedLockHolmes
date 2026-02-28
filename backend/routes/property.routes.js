const express = require('express');
const router = express.Router();
const solanaService = require('../services/solana.service');
const snowflakeService = require('../services/snowflake.service');
const geminiService = require('../services/gemini.service');

// GET /api/properties - Get all properties
router.get('/', async (req, res) => {
  try {
    const properties = await solanaService.getAllProperties();
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
router.post('/register', async (req, res) => {
  try {
    const { propertyId, address, ownerId, ownerName, deedHash, salePrice } = req.body;

    // Validate required fields
    if (!propertyId || !address || !ownerId || !ownerName || !deedHash || !salePrice) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    console.log('Registering property:', propertyId);

    // 1. Register on Solana blockchain
    const blockchainResult = await solanaService.registerProperty({
      propertyId,
      address,
      ownerId,
      ownerName,
      deedHash,
      salePrice: parseInt(salePrice)
    });

    // 2. Store in Snowflake for analytics
    await snowflakeService.storePropertyRecord({
      propertyId,
      address,
      ownerId,
      ownerName,
      deedHash,
      salePrice: parseInt(salePrice),
      transactionSignature: blockchainResult.transactionSignature,
      timestamp: Date.now()
    });

    // 3. Run AI fraud detection
    const fraudAnalysis = await geminiService.detectFraudRisk({
      propertyId,
      address,
      ownerName,
      salePrice: parseInt(salePrice)
    });

    // 4. Store fraud analysis in Snowflake
    await snowflakeService.storeAIAnalysis(
      propertyId,
      'FRAUD_RISK',
      fraudAnalysis,
      fraudAnalysis.riskScore
    );

    res.json({
      success: true,
      blockchain: blockchainResult,
      fraudAnalysis: fraudAnalysis,
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