const express = require('express');
const router = express.Router();
const { Product } = require('../lib/db');
const { s3 } = require('../middleware/uploadMiddleware');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { protect } = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    // Map id to _id for frontend compatibility
    const mappedProducts = products.map(p => ({ 
      ...p.toObject(), 
      _id: p._id.toString(), 
      price: Number(p.basePrice),
      basePrice: Number(p.basePrice)
    }));
    res.json(mappedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc    Search products
// @route   GET /api/products/search/:query
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const regex = new RegExp(query, 'i');
    const products = await Product.find({
      $or: [
        { name: regex },
        { category: regex },
        { description: regex }
      ]
    });
    const mappedProducts = products.map(p => ({ ...p.toObject(), _id: p._id.toString(), price: p.basePrice }));
    res.json(mappedProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get top 6 trending products (highest sales)
// @route   GET /api/products/trending
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const products = await Product.find().sort({ salesCount: -1 }).limit(7);
    const mappedProducts = products.map(p => ({ ...p.toObject(), _id: p._id.toString(), price: p.basePrice }));
    res.json(mappedProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Filter and sort products
// @route   GET /api/products/filter
// @access  Public
router.get('/filter', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, sort, search, limit = 20, skip = 0 } = req.query;
    
    let where = {};
    if (category && category !== 'all') {
      where.category = category;
    }
    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice.$gte = Number(minPrice);
      if (maxPrice) where.basePrice.$lte = Number(maxPrice);
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      where.$or = [
        { name: regex },
        { description: regex }
      ];
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'price-low') sortObj = { basePrice: 1 };
    if (sort === 'price-high') sortObj = { basePrice: -1 };
    if (sort === 'newest') sortObj = { createdAt: -1 };
    if (sort === 'popular') sortObj = { salesCount: -1 };

    const [products, total] = await Promise.all([
      Product.find(where)
        .sort(sortObj)
        .limit(Number(limit))
        .skip(Number(skip)),
      Product.countDocuments(where)
    ]);

    const mapped = products.map(p => ({ ...p.toObject(), _id: p._id.toString(), price: p.basePrice }));
    res.json({ products: mapped, total, count: products.length, skip, limit });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json({ 
        ...product.toObject(), 
        _id: product._id.toString(), 
        price: Number(product.basePrice),
        basePrice: Number(product.basePrice)
      });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

const { upload } = require('../middleware/uploadMiddleware');

// Helper: try multer upload, but if S3 fails/no file, continue with req.body
const tryUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.warn('Upload middleware warning (non-fatal):', err.message);
    }
    next();
  });
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private - Admin only
router.post('/', protect, tryUpload, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as an admin' });
    }
    const { name, description, basePrice, category, stock, variants, sku: manualSku } = req.body;

    if (!name || basePrice === undefined || !category) {
      return res.status(400).json({ message: 'Please provide all required fields (Name, Base Price, Category)' });
    }

    const images = [];
    if (req.file && req.file.location) {
      images.push(req.file.location);
    } else if (req.body.images) {
      if (Array.isArray(req.body.images)) {
        images.push(...req.body.images);
      } else {
        try {
          const manualImages = JSON.parse(req.body.images);
          if (Array.isArray(manualImages)) images.push(...manualImages);
        } catch (e) {
          if (typeof req.body.images === 'string' && req.body.images.startsWith('http')) images.push(req.body.images);
        }
      }
    }

    // Generate SKU if not provided
    let sku = manualSku;
    if (!sku) {
      const categoryPrefix = category.substring(0, 3).toUpperCase();
      const totalProducts = await Product.countDocuments();
      sku = `${categoryPrefix}-${String(totalProducts + 1).padStart(4, '0')}`;
    }

    const product = await Product.create({
      name,
      description: description || 'No description provided.',
      basePrice: Number(basePrice),
      category,
      stock: stock ? Number(stock) : 0,
      images: images,
      sku: sku,
    });

    res.status(201).json({ ...product.toObject(), _id: product._id.toString(), price: product.basePrice });
  } catch (error) {
    console.error('Product create error:', error.message);
    res.status(500).json({ message: 'Error creating product: ' + error.message });
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private - Admin only
router.put('/:id', protect, tryUpload, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as an admin' });
    }
    const { name, description, basePrice, category, stock, images: bodyImages, existingImages, sku } = req.body;
    
    let images = [];
    if (req.file && req.file.location) {
      images = [req.file.location];
    } else if (bodyImages) {
      if (Array.isArray(bodyImages)) {
        images = bodyImages;
      } else {
        try { images = JSON.parse(bodyImages); } catch (e) { 
          if (typeof bodyImages === 'string' && bodyImages.startsWith('http')) images = [bodyImages];
        }
      }
    } else if (existingImages) {
      try { images = JSON.parse(existingImages); } catch (e) { }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (basePrice !== undefined) updateData.basePrice = Number(basePrice);
    if (category !== undefined) updateData.category = category;
    if (stock !== undefined) updateData.stock = Number(stock);
    if (images.length > 0) updateData.images = images;
    if (sku !== undefined) updateData.sku = sku;

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({ ...product.toObject(), _id: product._id.toString(), price: product.basePrice });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product: ' + error.message });
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private - Admin only
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as an admin' });
    }
    const product = await Product.findById(req.params.id);
    
    if (product) {
      // Delete images from S3 if they are S3 URLs
      if (product.images && product.images.length > 0) {
        for (const imgUrl of product.images) {
          if (imgUrl.includes('amazonaws.com')) {
            try {
              const bucketName = process.env.AWS_BUCKET_NAME;
              const key = new URL(imgUrl).pathname.substring(1);
              await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
            } catch (s3Error) {
              console.error('Error deleting S3 object:', s3Error);
            }
          }
        }
      }
      await Product.findByIdAndDelete(req.params.id);
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product: ' + error.message });
  }
});

module.exports = router;
