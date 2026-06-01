const Razorpay = require('razorpay');
const prisma = require('../lib/prisma');

// Get Razorpay credentials from settings or env
const getRazorpayCredentials = async () => {
  try {
    const settings = await prisma.settings.findFirst();
    if (settings && settings.razorpayKeyId && settings.razorpayKeySecret) {
      return {
        key_id: settings.razorpayKeyId,
        key_secret: settings.razorpayKeySecret
      };
    }
  } catch (error) {
    console.log('Could not fetch Razorpay credentials from database, using env vars');
  }
  
  // Fallback to environment variables
  return {
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  };
};

// Initialize Razorpay with credentials
let razorpay = null;

const initializeRazorpay = async () => {
  const credentials = await getRazorpayCredentials();
  razorpay = new Razorpay({
    key_id: credentials.key_id,
    key_secret: credentials.key_secret
  });
  return razorpay;
};

// Create payment order
const createPaymentOrder = async (amount, currency = 'INR', receipt) => {
  try {
    if (!razorpay) {
      razorpay = await initializeRazorpay();
    }
    
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
    const credentials = await getRazorpayCredentials();
    const expectedSignature = crypto
      .createHmac('sha256', credentials.key_secret)
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
    if (!razorpay) {
      razorpay = await initializeRazorpay();
    }
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