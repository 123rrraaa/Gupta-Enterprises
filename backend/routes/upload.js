const express = require('express');
const router = express.Router();
const fileUpload = require('express-fileupload');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Middleware to handle file uploads
router.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  abortOnLimit: true,
  responseOnLimit: 'File size exceeds the limit',
}));

// Upload image endpoint
router.post('/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageFile = req.files.image;

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(imageFile.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP' 
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(imageFile);

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to upload image' 
    });
  }
});

module.exports = router;
