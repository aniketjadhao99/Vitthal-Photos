const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { protect } = require('../middleware/authMiddleware');
const { sendOrderNotification, notifyAdminNewOrder } = require('../services/notificationService');

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
  if (!product || typeof product !== 'object') return product;
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

const normalizeOrderCustomization = (customization) => {
  if (!customization || typeof customization !== 'object') return customization;
  return {
    ...customization,
    userUploadedImage: normalizeImageUrl(customization.userUploadedImage),
  };
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders/myorders
// @access  Private
router.get('/myorders', protect, async (req, res) => {
  try {
    // Find orders by user ID or by matching email
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: req.user._id },
          { email: req.user.email }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: { product: true }
        }
      }
    });

    // Map id to _id for frontend compatibility
    const mappedOrders = orders.map(order => ({
      ...order,
      _id: order.id,
      orderItems: order.orderItems.map(item => ({
        ...item,
        _id: item.id,
        product: item.product ? normalizeProduct({ ...item.product, _id: item.product.id }) : null,
        customization: normalizeOrderCustomization(item.customization)
      }))
    }));

    res.json(mappedOrders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// @desc    Create new order
// @route   POST /api/orders
router.post('/', async (req, res) => {
  const {
    customerName,
    email,
    address,
    city,
    postalCode,
    phone,
    orderItems,
    totalPrice,
    shippingAddress,
    paymentMethod,
    paymentId,
    userId,
    couponCode,
    discountAmount
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  // Validate Razorpay payments must have paymentId
  if (paymentMethod && paymentMethod !== 'Cash on Delivery' && !paymentId) {
    console.warn(`⚠️  Attempted to create ${paymentMethod} order without paymentId - BLOCKED`);
    return res.status(400).json({ 
      message: `${paymentMethod} payment requires verified payment. Please complete payment first.` 
    });
  }

  try {
    const { Order, Coupon, Product } = require('../lib/db');
    let finalDiscount = discountAmount || 0;
    let appliedCoupon = null;

    // Validate coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isActive && new Date() >= coupon.startsAt && new Date() <= coupon.expiresAt && (!coupon.maxUses || coupon.currentUses < coupon.maxUses)) {
        appliedCoupon = coupon.code;
        if (coupon.discountType === 'percentage') {
          finalDiscount = (totalPrice * coupon.discountValue) / 100;
          if (coupon.maxDiscount) finalDiscount = Math.min(finalDiscount, coupon.maxDiscount);
        } else {
          finalDiscount = coupon.discountValue;
        }
        // Increment coupon usage
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { currentUses: 1 } });
      }
    }

    // Prepare order items for Mongoose
    const mappedOrderItems = orderItems.map(item => {
      const prodId = item.product || item.id || item._id;
      return {
        product: (prodId && prodId.length > 20) ? prodId : null,
        name: item.name,
        quantity: Number(item.quantity || item.qty || 1),
        price: Number(item.price),
        customization: item.customization || {
          hasCustomization: !!(item.image || item.frame),
          userUploadedImage: item.image || null,
          selectedSize: item.size || null,
          selectedColor: item.color || null,
          selectedFrame: item.frame || null,
          orientation: item.orientation || null
        }
      };
    });

    const order = await Order.create({
      customerName,
      email,
      phone: phone || null,
      user: userId || null, // Map userId to user field in Mongoose
      totalPrice: Math.max(0, Number(totalPrice) - finalDiscount),
      discountAmount: finalDiscount,
      couponCode: appliedCoupon,
      shippingAddress: shippingAddress || { address, city, postalCode, country: 'India', phone },
      paymentMethod: paymentMethod || 'Cash on Delivery',
      orderItems: mappedOrderItems,
      status: 'pending',
      isPaid: paymentMethod === 'Card' || paymentMethod === 'UPI', // Auto-pay if digital
      paidAt: (paymentMethod === 'Card' || paymentMethod === 'UPI') ? new Date() : null
    });

    // Update sales count for products
    for (const item of order.orderItems) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, { $inc: { salesCount: item.quantity } });
      }
    }

    // Send notifications
    try {
      const orderData = { ...order.toObject(), id: order._id.toString() };
      // Notify Admin
      await notifyAdminNewOrder(orderData);
      // Notify Customer (This sends the SMS)
      await sendOrderNotification(orderData, 'pending');
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    res.status(201).json({ ...order.toObject(), _id: order._id.toString() });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Order creation failed: ' + error.message });
  }
});

const { Order } = require('../lib/db');

// @desc    Get all orders (Admin only)
router.get('/', protect, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as an admin' });
    }
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('orderItems.product');
    
    // Map to plain objects and ensure _id exists
    const mappedOrders = orders.map(order => ({
      ...order.toObject(),
      _id: order._id.toString(),
      orderItems: order.orderItems.map(item => ({
        ...item.toObject(),
        _id: item._id ? item._id.toString() : null,
        product: item.product ? { ...item.product.toObject(), _id: item.product._id.toString() } : null
      }))
    }));

    res.json(mappedOrders);
  } catch (error) {
    console.error('Fetch all orders error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private - Admin only
router.put('/:id/status', protect, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as an admin' });
    }
    const { status, trackingNumber, trackingURL, estimatedDelivery } = req.body;
    const { Order } = require('../lib/db');
    
    const updateData = {};
    if (status !== undefined) {
      updateData.status = status;
      // Auto-set isDelivered when status is 'delivered' (case-insensitive)
      if (status.toLowerCase() === 'delivered') {
        updateData.isDelivered = true;
        updateData.deliveredAt = new Date();
      }
    }
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (trackingURL !== undefined) updateData.trackingURL = trackingURL;
    if (estimatedDelivery !== undefined) updateData.estimatedDelivery = new Date(estimatedDelivery);

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });

    // Send notification to customer on status change
    if (status) {
      try {
        await sendOrderNotification(updatedOrder.toObject(), status, trackingURL || trackingNumber);
      } catch (notifErr) {
        console.error('Status notification error:', notifErr);
      }
    }

    res.json({ ...updatedOrder.toObject(), _id: updatedOrder._id.toString() });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

// @desc    Fix existing delivered orders (Admin only - migration endpoint)
// @route   PUT /api/orders/fix/delivered
// @access  Private - Admin only
router.put('/fix/delivered', protect, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as an admin' });
    }
    const { Order } = require('../lib/db');
    
    // Fix all orders with status='Delivered' (any case) but isDelivered=false
    const result = await Order.updateMany(
      { 
        status: { $regex: 'delivered', $options: 'i' },
        isDelivered: false
      },
      { 
        $set: { 
          isDelivered: true,
          deliveredAt: new Date()
        }
      }
    );
    
    res.json({ 
      message: 'Fixed delivered orders',
      matched: result.matchedCount,
      modified: result.modifiedCount
    });
  } catch (error) {
    console.error('Fix delivered orders error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

// @desc    Delete order (Admin only)
// @route   DELETE /api/orders/:id
// @access  Private - Admin only
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as an admin' });
    }
    const { Order } = require('../lib/db');
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order removed' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
