const express = require('express');
const router = express.Router();
const geminiService = require('../services/gemini.service');
const solanaService = require('../services/solana.service');

// POST /api/ai/chat - Chat with property AI
router.post('/chat', async (req, res) => {
  try {
    const { propertyId, question, context } = req.body;

    if (!propertyId || !question) {
      return res.status(400).json({
        success: false,
        error: 'Property ID and question required'
      });
    }
    
    const property = await solanaService.getProperty(propertyId);
    
    const answer = await geminiService.chatWithProperty(
      propertyId,
      question,
      property,
      context || []
    );
    
    res.json({ 
      success: true, 
      data: answer 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/ai/describe - Generate property description
router.post('/describe', async (req, res) => {
  try {
    const { propertyId } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: 'Property ID required'
      });
    }

    const property = await solanaService.getProperty(propertyId);
    const description = await geminiService.generatePropertyDescription(property);
    
    res.json({ 
      success: true, 
      data: description 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/ai/fraud-check - Fraud detection
router.post('/fraud-check', async (req, res) => {
  try {
    const { propertyId } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: 'Property ID required'
      });
    }

    const property = await solanaService.getProperty(propertyId);
    const fraudAnalysis = await geminiService.detectFraudRisk(property);
    
    res.json({ 
      success: true, 
      data: fraudAnalysis 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;