const Razorpay = require('razorpay');

// CRITICAL: Initialize Razorpay ONLY with environment variables to prevent startup failures
// Never attempt database queries during module load
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_default',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'default_secret'
});

console.log('✅ Razorpay initialized with environment variables');

// Create payment order
const createPaymentOrder = async (amount, currency = 'INR', receipt) => {
  try {
    const options = {
      amount: amount * 100, // Razorpay expects amount in paisa
      currency,
      receipt,
      payment_capture: 1 // Auto capture payment
    };

    const order = await razorpay.orders.create(options);
    
    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    };
  } catch (error) {
    console.error('❌ Error creating payment order:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Verify payment
const verifyPayment = async (paymentId, orderId, signature) => {
  try {
    const crypto = require('crypto');
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error('❌ Razorpay secret missing in environment while verifying payment');
      return { success: false, verified: false, error: 'Missing Razorpay secret' };
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    console.log('🔐 [VerifyPayment] orderId:', orderId);
    console.log('🔐 [VerifyPayment] paymentId:', paymentId);
    console.log('🔐 [VerifyPayment] razorpay_signature:', signature);
    console.log('🔐 [VerifyPayment] expectedSignature:', expectedSignature);

    if (expectedSignature === signature) {
      return { success: true, verified: true };
    }

    console.warn('❌ [VerifyPayment] signature mismatch');
    return { success: false, verified: false, error: 'Invalid signature' };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { success: false, error: error.message };
  }
};

// Get payment details
const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact
      }
    };
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails
};