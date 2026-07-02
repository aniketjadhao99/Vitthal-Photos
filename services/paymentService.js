const Razorpay = require('razorpay');

// CRITICAL: Initialize Razorpay ONLY with environment variables to prevent startup failures
// Never attempt database queries during module load
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.error('❌ Razorpay credentials are missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
}

const razorpay = new Razorpay({
  key_id: keyId || 'rzp_test_default',
  key_secret: keySecret || 'default_secret'
});

console.log('✅ Razorpay initialized with environment variables');

// Create payment order
const createPaymentOrder = async (amount, currency = 'INR', receipt) => {
  try {
    if (!keyId || !keySecret) {
      const message = 'Missing Razorpay credentials';
      console.error('❌', message);
      return { success: false, error: message };
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      const message = 'Invalid amount for Razorpay order';
      console.error('❌', message, 'amount=', amount);
      return { success: false, error: message };
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paisa
      currency,
      receipt,
      payment_capture: 1 // Auto capture payment
    };

    console.log('🔔 [PaymentService] Creating Razorpay order with options:', options);

    const order = await razorpay.orders.create(options);
    
    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: keyId
    };
  } catch (error) {
    console.error('❌ Error creating payment order:', error.message, error);
    return {
      success: false,
      error: error.message || 'Unknown Razorpay error'
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