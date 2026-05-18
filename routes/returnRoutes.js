const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get user's return requests
// @route   GET /api/returns
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Find all orders for this user
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: req.user._id },
          { email: req.user.email }
        ]
      }
    });
    const orderIds = orders.map(o => o.id || o._id.toString());

    const returns = await prisma.returnRequest.findMany({
      where: {
        orderId: { in: orderIds }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Populate order field manually for each return request
    const mapped = returns.map(r => {
      const order = orders.find(o => (o.id || o._id.toString()) === r.orderId.toString());
      return {
        ...r.toObject ? r.toObject() : r,
        _id: r.id || r._id ? (r.id || r._id).toString() : null,
        order: order
      };
    });
    
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching return requests:', error);
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
    const { Order } = require('../lib/db');

    if (!orderId || !reason) {
      return res.status(400).json({ message: 'Order ID and reason are required' });
    }

    // Verify order belongs to user (by user ID or email)
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user
    if (order.user?.toString() !== req.user._id?.toString() && order.email !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized for this order' });
    }

    // Check if return already exists
    const existing = await prisma.returnRequest.findFirst({ where: { orderId } });
    if (existing) {
      return res.status(400).json({ message: 'Return request already exists for this order' });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Can only return delivered orders. Current status: ' + order.status });
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
    const returnRequest = await prisma.returnRequest.findUnique({ where: { id: req.params.id } });
    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }
    const order = await prisma.order.findUnique({ where: { id: returnRequest.orderId.toString() } });
    if (!order || order.userId !== req.user._id) {
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
