const express = require('express');
const router = express.Router();
const { upload, s3 } = require('../middleware/uploadMiddleware');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// User sends POST to /api/upload -> We send back the AWS URL
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  res.send({
    message: 'Image uploaded successfully',
    imageUrl: req.file.location,
    key: req.file.key
  });
});

// Proxy endpoint to fetch objects from S3
router.get('/proxy', async (req, res) => {
  try {
    const { url, key } = req.query;
    let objectKey = key;

    if (!objectKey) {
      if (!url) return res.status(400).send('Missing url or key');
      try {
        const parsed = new URL(url);
        if (!parsed.hostname.includes(process.env.AWS_BUCKET_NAME)) {
          return res.status(400).send('URL host does not match configured bucket');
        }
        objectKey = parsed.pathname.replace(/^\//, '');
      } catch (err) {
        return res.status(400).send('Invalid URL');
      }
    }

    const cmd = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: objectKey });
    const data = await s3.send(cmd);
    if (data.ContentType) res.setHeader('Content-Type', data.ContentType);
    if (data.ContentLength) res.setHeader('Content-Length', data.ContentLength);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    data.Body.pipe(res);
  } catch (error) {
    console.error('Error proxying S3 object:', error);
    res.status(500).send('Failed to fetch image');
  }
});

// Public presigned URL generator
router.get('/presign-public', async (req, res) => {
  try {
    const { key, expires } = req.query;
    if (!key) return res.status(400).json({ message: 'key query parameter required' });
    if (!key.startsWith('uploads/') || key.includes('..')) {
      return res.status(400).json({ message: 'Invalid key' });
    }

    const cmd = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key });
    const ttl = expires ? parseInt(expires, 10) : 3600;
    const url = await getSignedUrl(s3, cmd, { expiresIn: ttl });
    return res.json({ url, expiresIn: ttl });
  } catch (error) {
    console.error('Error generating public presigned url:', error);
    return res.status(500).json({ message: 'Failed to generate presigned url', error: error.message });
  }
});

module.exports = router;