const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// @desc    Get user's return requests
// @route   GET /api/returns
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { Order, ReturnRequest } = require('../lib/db');
    
    // Find all orders for this user
    const orders = await Order.find({
      $or: [
        { user: req.user._id },
        { email: req.user.email }
      ]
    });
    
    const orderIds = orders.map(o => o._id);

    // Find return requests for these orders
    const returns = await ReturnRequest.find({
      orderId: { $in: orderIds }
    }).sort({ createdAt: -1 });
    
    // Populate order data for each return request
    const mapped = returns.map(r => {
      const order = orders.find(o => o._id.toString() === r.orderId.toString());
      return {
        _id: r._id.toString(),
        orderId: r.orderId.toString(),
        reason: r.reason,
        description: r.description,
        status: r.status,
        refundAmount: r.refundAmount,
        refundStatus: r.refundStatus,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        order: order ? { ...order.toObject(), _id: order._id.toString() } : null
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
    const { Order, ReturnRequest } = require('../lib/db');
    
    const returns = await ReturnRequest.find().sort({ createdAt: -1 });
    
    // Populate order data for each return
    const mapped = await Promise.all(returns.map(async (r) => {
      const order = await Order.findById(r.orderId);
      return {
        _id: r._id.toString(),
        orderId: r.orderId.toString(),
        reason: r.reason,
        description: r.description,
        status: r.status,
        refundAmount: r.refundAmount,
        refundStatus: r.refundStatus,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        order: order ? { ...order.toObject(), _id: order._id.toString() } : null
      };
    }));
    
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching returns:', error);
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
    const order = await Order.findById(orderId).lean();
    if (!order) {
      console.log('Order not found for ID:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('Order details:', {
      id: order._id,
      status: order.status,
      isDelivered: order.isDelivered,
      userEmail: order.email,
      userId: order.user?.toString()
    });

    // Check if order belongs to user
    if (order.user?.toString() !== req.user._id?.toString() && order.email !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized for this order' });
    }

    // Check if return already exists
    const { ReturnRequest } = require('../lib/db');
    const existing = await ReturnRequest.findOne({ orderId });
    if (existing) {
      return res.status(400).json({ message: 'Return request already exists for this order' });
    }

    // Check if order is delivered (check both status and isDelivered fields, case-insensitive)
    const isDelivered = order.status?.toLowerCase() === 'delivered' || order.isDelivered === true;
    
    if (!isDelivered) {
      return res.status(400).json({ 
        message: 'Can only return delivered orders.', 
        currentStatus: order.status,
        isDelivered: order.isDelivered
      });
    }

    const returnRequest = await ReturnRequest.create({
      orderId,
      reason,
      description,
      refundAmount: order.totalPrice
    });

    res.status(201).json({ 
      _id: returnRequest._id.toString(),
      orderId: returnRequest.orderId.toString(),
      reason: returnRequest.reason,
      description: returnRequest.description,
      status: returnRequest.status,
      refundAmount: returnRequest.refundAmount,
      createdAt: returnRequest.createdAt
    });
  } catch (error) {
    console.error('Return request creation error:', error);
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

    const { Order, ReturnRequest } = require('../lib/db');
    const { status, refundAmount, refundStatus } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (refundAmount) updateData.refundAmount = Number(refundAmount);
    if (refundStatus) updateData.refundStatus = refundStatus;

    const returnRequest = await ReturnRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // If approved, update order to 'returned' and mark as refunded
    if (status === 'approved') {
      await Order.findByIdAndUpdate(
        returnRequest.orderId,
        { status: 'returned', isPaid: false }
      );
    }

    res.json({
      _id: returnRequest._id.toString(),
      orderId: returnRequest.orderId.toString(),
      reason: returnRequest.reason,
      description: returnRequest.description,
      status: returnRequest.status,
      refundAmount: returnRequest.refundAmount,
      refundStatus: returnRequest.refundStatus,
      createdAt: returnRequest.createdAt,
      updatedAt: returnRequest.updatedAt
    });
  } catch (error) {
    console.error('Error updating return request:', error);
    res.status(500).json({ message: 'Error updating return request', error: error.message });
  }
});

// @desc    Cancel return request
// @route   DELETE /api/returns/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const { Order, ReturnRequest } = require('../lib/db');
    
    const returnRequest = await ReturnRequest.findById(req.params.id);
    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    const order = await Order.findById(returnRequest.orderId);
    if (!order || (order.user?.toString() !== req.user._id?.toString() && order.email !== req.user.email)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (returnRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending returns' });
    }

    await ReturnRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Return request cancelled' });
  } catch (error) {
    console.error('Error cancelling return:', error);
    res.status(500).json({ message: 'Error cancelling return', error: error.message });
  }
});

module.exports = router;
