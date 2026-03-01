const express = require('express');
const router = express.Router();
const mongoService = require('../services/mongo.service');

// GET /api/analytics - Get overall analytics
router.get('/', async (req, res) => {
  try {
    const analytics = await mongoService.getPropertyAnalytics();
    res.json({ 
      success: true, 
      data: analytics 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/analytics/history/:propertyId - Get transaction history
router.get('/history/:propertyId', async (req, res) => {
  try {
    const history = await mongoService.getTransactionHistory(req.params.propertyId);
    res.json({ 
      success: true, 
      count: history.length,
      data: history 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
