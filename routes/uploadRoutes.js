const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const { upload, storeFileInMongo, getFileFromMongo } = require('../middleware/uploadMiddleware');

router.post('/', protect, requireAdmin, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(413).json({ message: 'File too large' });
  }

  try {
    const stored = await storeFileInMongo(req.file);
    return res.json({
      message: 'Image uploaded successfully',
      imageUrl: `/api/upload/${stored.id}`,
      key: stored.id,
      fileId: stored.id,
    });
  } catch (error) {
    console.error('MongoDB image upload failed:', error.message);
    return res.status(500).json({ message: 'Image upload failed', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await getFileFromMongo(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.setHeader('Content-Type', result.file.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    result.stream.pipe(res);
  } catch (error) {
    console.error('Error serving image from MongoDB:', error.message);
    return res.status(500).json({ message: 'Failed to fetch image', error: error.message });
  }
});

router.get('/proxy', async (req, res) => {
  return res.status(404).json({ message: 'Legacy AWS proxy is not available in this MongoDB-only upload setup' });
});

module.exports = router;