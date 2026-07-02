const express = require('express');
const router = express.Router();
const { createPaymentOrder, verifyPayment } = require('../services/paymentService');

// @desc    Create payment order
// @route   POST /api/payment/create-order
// @access  Public
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Valid amount is required' });

    const receipt = `receipt_${Date.now()}`;
    const orderResult = await createPaymentOrder(amount, currency, receipt);

    if (orderResult.success) {
      res.json({ orderId: orderResult.orderId, amount: orderResult.amount, currency: orderResult.currency, key: orderResult.key });
    } else {
      res.status(500).json({ message: 'Failed to create payment order' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Verify payment
// @route   POST /api/payment/verify
// @access  Public
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    console.log('🔍 [Payment Verify Route] payload:', {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    });

    const verificationResult = await verifyPayment(razorpay_payment_id, razorpay_order_id, razorpay_signature);

    if (verificationResult.success && verificationResult.verified) {
      res.json({ success: true, verified: true, message: 'Payment verified', paymentId: razorpay_payment_id });
    } else {
      console.warn('❌ [Payment Verify Route] verification failed:', verificationResult.error);
      res.status(400).json({ success: false, verified: false, message: verificationResult.error || 'Verification failed' });
    }
  } catch (error) {
    console.error('❌ [Payment Verify Route] unexpected error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;