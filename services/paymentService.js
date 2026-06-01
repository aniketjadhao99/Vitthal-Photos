const Razorpay = require('razorpay');

// Initialize Razorpay with env vars (primary, reliable method)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_default',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'default_secret'
});

// Get Razorpay credentials from database or env (lazy loaded, optional override)
const getRazorpayCredentials = async () => {
  try {
    // Try to get from database only if needed
    const prisma = require('../lib/prisma');
    const settings = await prisma.settings.findFirst();
    if (settings && settings.razorpayKeyId && settings.razorpayKeySecret) {
      return {
        key_id: settings.razorpayKeyId,
        key_secret: settings.razorpayKeySecret
      };
    }
  } catch (error) {
    // Silently fallback to env vars if database fails
    console.log('Using env vars for Razorpay (database not available)');
  }
  
  // Fallback to environment variables
  return {
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  };
};

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
    const credentials = await getRazorpayCredentials();
    
    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: credentials.key_id
    };
  } catch (error) {
    console.error('Error creating payment order:', error);
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
    // Use env var key secret for verification (more reliable)
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'default_secret';
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (expectedSignature === signature) {
      return { success: true, verified: true };
    } else {
      return { success: false, verified: false, error: 'Invalid signature' };
    }
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