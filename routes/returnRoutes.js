const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get user's return requests
// @route   GET /api/returns
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const returns = await prisma.returnRequest.findMany({
      where: {
        order: { userId: req.user.id }
      },
      include: { order: true },
      orderBy: { createdAt: 'desc' }
    });
    const mapped = returns.map(r => ({ ...r, _id: r.id }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching returns', error: error.message });
  }
});

// @desc    Get all returns (Admin)
// @route   GET /api/returns/admin/all
// @access  Private - Admin
router.get('/admin/all', protect, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const returns = await prisma.returnRequest.findMany({
      include: { order: true },
      orderBy: { createdAt: 'desc' }
    });
    const mapped = returns.map(r => ({ ...r, _id: r.id }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching returns', error: error.message });
  }
});

// @desc    Create return request
// @route   POST /api/returns
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { orderId, reason, description } = req.body;

    if (!orderId || !reason) {
      return res.status(400).json({ message: 'Order ID and reason are required' });
    }

    // Verify order belongs to user
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized for this order' });
    }

    // Check if return already exists
    const existing = await prisma.returnRequest.findFirst({ where: { orderId } });
    if (existing) {
      return res.status(400).json({ message: 'Return request already exists for this order' });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Can only return delivered orders' });
    }

    const returnRequest = await prisma.returnRequest.create({
      data: {
        orderId,
        reason,
        description,
        refundAmount: order.totalPrice
      },
      include: { order: true }
    });

    res.status(201).json({ ...returnRequest, _id: returnRequest.id });
  } catch (error) {
    res.status(500).json({ message: 'Error creating return request', error: error.message });
  }
});

// @desc    Update return status (Admin)
// @route   PUT /api/returns/:id
// @access  Private - Admin
router.put('/:id', protect, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { status, refundAmount, refundStatus } = req.body;

    const returnRequest = await prisma.returnRequest.update({
      where: { id: req.params.id },
      data: {
        status: status || undefined,
        refundAmount: refundAmount ? Number(refundAmount) : undefined,
        refundStatus: refundStatus || undefined
      },
      include: { order: true }
    });

    // If approved, update order to 'returned' and mark as refunded
    if (status === 'approved') {
      await prisma.order.update({
        where: { id: returnRequest.orderId },
        data: { status: 'returned', isPaid: false }
      });
    }

    res.json({ ...returnRequest, _id: returnRequest.id });
  } catch (error) {
    res.status(500).json({ message: 'Error updating return request', error: error.message });
  }
});

// @desc    Cancel return request
// @route   DELETE /api/returns/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const returnRequest = await prisma.returnRequest.findUnique({ where: { id: req.params.id }, include: { order: true } });
    if (!returnRequest || returnRequest.order.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (returnRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending returns' });
    }

    await prisma.returnRequest.delete({ where: { id: req.params.id } });
    res.json({ message: 'Return request cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling return', error: error.message });
  }
});

module.exports = router;
