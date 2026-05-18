const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get all coupons (Admin only)
// @route   GET /api/coupons
// @access  Private - Admin
router.get('/', protect, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as an admin' });
    }
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    });
    const mapped = coupons.map(c => {
      const obj = typeof c.toObject === 'function' ? c.toObject({ virtuals: true }) : c;
      return { ...obj, _id: obj._id ? String(obj._id) : obj.id };
    });
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons', error: error.message });
  }
});

// @desc    Validate coupon code
// @route   POST /api/coupons/validate
// @access  Public
router.post('/validate', async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Coupon code required' });
    }

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: 'Coupon is inactive' });
    }

    if (new Date() < coupon.startsAt) {
      return res.status(400).json({ message: 'Coupon not yet active' });
    }

    if (new Date() > coupon.expiresAt) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    if (coupon.minOrderValue && orderTotal < coupon.minOrderValue) {
      return res.status(400).json({ message: `Minimum order value is ₹${coupon.minOrderValue}` });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    res.json({
      _id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount: discount,
      finalPrice: Math.max(0, orderTotal - discount)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error validating coupon', error: error.message });
  }
});

// @desc    Create coupon (Admin only)
// @route   POST /api/coupons
// @access  Private - Admin
router.post('/', protect, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as an admin' });
    }

    const { code, description, discountType, discountValue, maxDiscount, minOrderValue, maxUses, startsAt, expiresAt } = req.body;

    if (!code || !discountValue || !startsAt || !expiresAt) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType: discountType || 'percentage',
        discountValue: Number(discountValue),
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        minOrderValue: minOrderValue ? Number(minOrderValue) : null,
        maxUses: maxUses ? Number(maxUses) : null,
        startsAt: new Date(startsAt),
        expiresAt: new Date(expiresAt)
      }
    });

    const obj = typeof coupon.toObject === 'function' ? coupon.toObject({ virtuals: true }) : coupon;
    res.status(201).json({ ...obj, _id: obj._id ? String(obj._id) : obj.id });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    res.status(500).json({ message: 'Error creating coupon', error: error.message });
  }
});

// @desc    Update coupon (Admin only)
// @route   PUT /api/coupons/:id
// @access  Private - Admin
router.put('/:id', protect, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as an admin' });
    }

    const { code, description, discountType, discountValue, maxDiscount, minOrderValue, maxUses, startsAt, expiresAt, isActive } = req.body;

    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        code: code ? code.toUpperCase() : undefined,
        description,
        discountType,
        discountValue: discountValue ? Number(discountValue) : undefined,
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        minOrderValue: minOrderValue ? Number(minOrderValue) : undefined,
        maxUses: maxUses ? Number(maxUses) : undefined,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    const obj = typeof coupon.toObject === 'function' ? coupon.toObject({ virtuals: true }) : coupon;
    res.json({ ...obj, _id: obj._id ? String(obj._id) : obj.id });
  } catch (error) {
    res.status(500).json({ message: 'Error updating coupon', error: error.message });
  }
});

// @desc    Delete coupon (Admin only)
// @route   DELETE /api/coupons/:id
// @access  Private - Admin
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as an admin' });
    }

    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting coupon', error: error.message });
  }
});

module.exports = router;
