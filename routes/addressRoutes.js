const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get user's addresses
// @route   GET /api/addresses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });
    const mapped = addresses.map(a => ({ ...a, _id: a.id }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching addresses', error: error.message });
  }
});

// @desc    Create new address
// @route   POST /api/addresses
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, phone, address, city, state, postalCode, country, isDefault } = req.body;

    if (!name || !phone || !address || !city || !state || !postalCode) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // If this is default, remove default from others
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data: { isDefault: false }
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: req.user.id,
        name,
        phone,
        address,
        city,
        state,
        postalCode,
        country: country || 'India',
        isDefault: isDefault || false
      }
    });

    res.status(201).json({ ...newAddress, _id: newAddress.id });
  } catch (error) {
    res.status(500).json({ message: 'Error creating address', error: error.message });
  }
});

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, phone, address, city, state, postalCode, country, isDefault } = req.body;

    // Verify ownership
    const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this address' });
    }

    // If setting as default, remove from others
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id, isDefault: true, id: { not: req.params.id } },
        data: { isDefault: false }
      });
    }

    const updated = await prisma.address.update({
      where: { id: req.params.id },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        postalCode: postalCode || undefined,
        country: country || undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined
      }
    });

    res.json({ ...updated, _id: updated.id });
  } catch (error) {
    res.status(500).json({ message: 'Error updating address', error: error.message });
  }
});

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this address' });
    }

    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting address', error: error.message });
  }
});

module.exports = router;
