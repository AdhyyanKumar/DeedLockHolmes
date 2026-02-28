const express = require('express');
const router = express.Router();
const snowflakeService = require('../services/snowflake.service');

// GET /api/analytics - Get overall analytics
router.get('/', async (req, res) => {
  try {
    const analytics = await snowflakeService.getPropertyAnalytics();
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
    const history = await snowflakeService.getTransactionHistory(req.params.propertyId);
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