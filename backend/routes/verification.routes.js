const express = require('express');
const router = express.Router();
const multer = require('multer');
const { hashFile } = require('../utils/hash');
const solanaService = require('../services/solana.service');
const mongoService = require('../services/mongo.service');

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/verification/verify - Verify deed by file
router.post('/verify', upload.single('deed'), async (req, res) => {
  try {
    const { propertyId } = req.body;
    
    if (!propertyId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Property ID required' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    console.log('Verifying deed for property:', propertyId);

    // Hash the uploaded file
    const uploadedHash = hashFile(req.file.buffer);
    console.log('File hash:', uploadedHash);

    // Verify against blockchain
    const result = await solanaService.verifyDeed(propertyId, uploadedHash);

    // Log verification in MongoDB
    await mongoService.logVerification(
      propertyId,
      uploadedHash,
      result.recordedHash,
      result.isValid
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/verification/verify-hash - Verify deed by hash
router.post('/verify-hash', async (req, res) => {
  try {
    const { propertyId, deedHash } = req.body;

    if (!propertyId || !deedHash) {
      return res.status(400).json({
        success: false,
        error: 'Property ID and deed hash required'
      });
    }

    const result = await solanaService.verifyDeed(propertyId, deedHash);

    // Log verification in MongoDB
    await mongoService.logVerification(
      propertyId,
      deedHash,
      result.recordedHash,
      result.isValid
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
