const express = require('express');
const router = express.Router();
const { Product } = require('../lib/db');
const { protect } = require('../middleware/authMiddleware');

const awsBucketName = process.env.AWS_BUCKET_NAME;

const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (!url.startsWith('http')) return url;
  const isAwsImage = url.includes('amazonaws.com') && (awsBucketName ? url.includes(awsBucketName) : true);
  if (isAwsImage) {
    return `/api/upload/proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

const normalizeProduct = (product) => {
  if (!product) return product;
  const normalized = { ...product };
  if (Array.isArray(normalized.images)) {
    normalized.images = normalized.images.map(normalizeImageUrl);
  }
  if (normalized.image) {
    normalized.image = normalizeImageUrl(normalized.image);
  }
  if (normalized.thumbnail) {
    normalized.thumbnail = normalizeImageUrl(normalized.thumbnail);
  }
  return normalized;
};

// Escape user input before using in RegExp to prevent ReDoS and unintended matches
const escapeRegex = (s) => {
  if (typeof s !== 'string') return s;
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    // Map id to _id for frontend compatibility
    const mappedProducts = products.map(p => {
      const product = {
        ...p.toObject(),
        _id: p._id.toString(),
        price: Number(p.basePrice),
        basePrice: Number(p.basePrice)
      };
      return normalizeProduct(product);
    });
    res.json(mappedProducts);
  } catch (error) {
    console.error('⚠️ MongoDB products query failed, using static product catalog fallback:', error.message);
    try {
      const staticProducts = require('../Data/products');
      const mapped = staticProducts.map((p, idx) => normalizeProduct({
        ...p,
        _id: `static-product-${idx}`,
        price: Number(p.basePrice),
        basePrice: Number(p.basePrice)
      }));
      res.json(mapped);
    } catch (fallbackError) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  }
});

// @desc    Search products
// @route   GET /api/products/search/:query
router.get('/search/:query', async (req, res) => {
  try {
    const query = String(req.params.query || '').trim();
    if (query.length === 0) return res.status(400).json({ message: 'Empty search query' });
    if (query.length > 200) return res.status(400).json({ message: 'Search query too long' });
    const safe = escapeRegex(query);
    const regex = new RegExp(safe, 'i');
    const products = await Product.find({
      $or: [
        { name: regex },
        { category: regex },
        { description: regex }
      ]
    });
    const mappedProducts = products.map(p => normalizeProduct({ ...p.toObject(), _id: p._id.toString(), price: p.basePrice }));
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
    const mappedProducts = products.map(p => normalizeProduct({ ...p.toObject(), _id: p._id.toString(), price: p.basePrice }));
    res.json(mappedProducts);
  } catch (error) {
    console.error('⚠️ MongoDB trending query failed, using static product fallback:', error.message);
    try {
      const staticProducts = require('../Data/products');
      const mapped = staticProducts.slice(0, 6).map((p, idx) => ({
        ...p,
        _id: `static-product-${idx}`,
        price: Number(p.basePrice),
        basePrice: Number(p.basePrice)
      }));
      res.json(mapped);
    } catch (fallbackError) {
      res.status(500).json({ message: 'Server Error' });
    }
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
      const qs = String(search || '').trim();
      if (qs.length > 200) return res.status(400).json({ message: 'Search query too long' });
      const safe = escapeRegex(qs);
      const regex = new RegExp(safe, 'i');
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

    const mapped = products.map(p => normalizeProduct({ ...p.toObject(), _id: p._id.toString(), price: p.basePrice }));
    res.json({ products: mapped, total, count: products.length, skip, limit });
  } catch (error) {
    console.error('⚠️ MongoDB filter query failed, using static product catalog fallback:', error.message);
    try {
      const staticProducts = require('../Data/products');
      const { category, search } = req.query;
      
      let filtered = staticProducts;
      if (category && category !== 'all') {
        // Normalize search to handle plural categories (e.g. God vs Gods)
        const catSearch = category.toLowerCase();
        filtered = filtered.filter(p => {
          const productCat = p.category.toLowerCase();
          return productCat.includes(catSearch) || catSearch.includes(productCat);
        });
      }
      if (search) {
        const regex = new RegExp(search, 'i');
        filtered = filtered.filter(p => regex.test(p.name) || regex.test(p.description));
      }
      
      const mapped = filtered.map((p, idx) => normalizeProduct({
        ...p,
        _id: `static-product-${idx}`,
        price: Number(p.basePrice),
        basePrice: Number(p.basePrice)
      }));
      
      res.json({ products: mapped, total: mapped.length, count: mapped.length, skip: 0, limit: 20 });
    } catch (fallbackError) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(normalizeProduct({ 
        ...product.toObject(), 
        _id: product._id.toString(), 
        price: Number(product.basePrice),
        basePrice: Number(product.basePrice)
      }));
    } else {
      // Check static fallback products
      const staticProducts = require('../Data/products');
      const found = staticProducts.find((p, idx) => `static-product-${idx}` === req.params.id);
      if (found) {
        res.json({
          ...found,
          _id: req.params.id,
          price: Number(found.basePrice),
          basePrice: Number(found.basePrice)
        });
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    }
  } catch (error) {
    console.error('⚠️ MongoDB product details fetch failed, using static product details fallback:', error.message);
    try {
      const staticProducts = require('../Data/products');
      const found = staticProducts.find((p, idx) => `static-product-${idx}` === req.params.id);
      if (found) {
        res.json({
          ...found,
          _id: req.params.id,
          price: Number(found.basePrice),
          basePrice: Number(found.basePrice)
        });
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (fallbackError) {
      res.status(500).json({ message: 'Server Error' });
    }
  }
});

const { upload, storeFileInMongo } = require('../middleware/uploadMiddleware');

// Helper: try multer upload, but if MongoDB storage fails/no file, continue with req.body
const tryUpload = (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      console.warn('Upload middleware warning (non-fatal):', err.message);
    }

    if (req.file) {
      try {
        const stored = await storeFileInMongo(req.file);
        req.file.location = `/api/upload/${stored.id}`;
        req.file.key = stored.id;
        req.file.fileId = stored.id;
      } catch (error) {
        console.error('MongoDB image storage failed:', error.message);
      }
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
      if (product.images && product.images.length > 0) {
        for (const imgUrl of product.images) {
          if (typeof imgUrl === 'string' && imgUrl.includes('/api/upload/')) {
            const match = imgUrl.match(/\/api\/upload\/([^/?#]+)/);
            if (match && match[1]) {
              try {
                const { deleteFileFromMongo } = require('../middleware/uploadMiddleware');
                await deleteFileFromMongo(match[1]);
              } catch (deleteError) {
                console.error('Error deleting MongoDB image:', deleteError);
              }
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
