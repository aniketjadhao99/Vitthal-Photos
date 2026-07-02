import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { normalizeImageUrl } from '../utils/imageUtils';

const API_URL = '/api';

const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    address: '', city: '', state: '', pincode: '', payment: 'cod'
  });
  const [coupon, setCoupon] = useState(null);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const razorpayScriptPromiseRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('vitthal_token');
    const user = JSON.parse(localStorage.getItem('vitthal_user') || 'null');
    if (!token || !user) {
      addToast('Please login first to proceed to checkout.', 'error');
      navigate('/login');
      return;
    }

    const cart = JSON.parse(localStorage.getItem('vitthal_cart')) || [];
    if (cart.length === 0) { navigate('/cart'); return; }
    setCartItems(cart.map(item => ({ ...item, image: normalizeImageUrl(item.image) })));
    setForm(f => ({ ...f, email: user.email || '', firstName: user.name || '' }));

    const savedCoupon = JSON.parse(localStorage.getItem('vitthal_coupon'));
    if (savedCoupon && savedCoupon.discount) {
      setCoupon(savedCoupon);
    }
  }, [navigate, addToast]);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
  const total = Math.max(0, subtotal - (coupon?.discount || 0));
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = { width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box' };

  const loadRazorpayScript = async () => {
    if (typeof window === 'undefined') {
      throw new Error('Razorpay can only be loaded in the browser.');
    }

    if (window.Razorpay) {
      return window.Razorpay;
    }

    if (razorpayScriptPromiseRef.current) {
      return razorpayScriptPromiseRef.current;
    }

    razorpayScriptPromiseRef.current = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.Razorpay), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Razorpay script failed to load.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => reject(new Error('Razorpay script failed to load.'));
      document.body.appendChild(script);
    });

    try {
      return await razorpayScriptPromiseRef.current;
    } catch (error) {
      razorpayScriptPromiseRef.current = null;
      throw error;
    }
  };

  // Handle order placement - decides between COD and Razorpay
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    console.log('════════════════════════════════════════');
    console.log('📍 [FORM SUBMIT] CLICKED - Form submission initiated');
    console.log('════════════════════════════════════════');
    console.log('Current payment method:', form.payment);
    console.log('isPlacingOrder state:', isPlacingOrder);
    console.log('Timestamp:', new Date().toISOString());
    
    // Validate form
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.address || !form.city || !form.pincode) {
      console.warn('❌ Form validation failed - missing fields');
      addToast('Please fill in all required fields', 'error');
      return;
    }

    // Prevent double submission
    if (isPlacingOrder) {
      console.warn('⚠️  Already processing, preventing double submission');
      addToast('Please wait, processing your order...', 'info');
      return;
    }
    
    // CRITICAL: Validate payment method is selected
    if (!form.payment) {
      console.error('❌ NO PAYMENT METHOD SELECTED');
      addToast('Please select a payment method', 'error');
      return;
    }
    
    // Set loading state IMMEDIATELY to block further clicks
    setIsPlacingOrder(true);
    
    console.log('✅ Validation passed, payment method:', form.payment);
    
    try {
      // For COD, place order directly
      if (form.payment === 'cod') {
        console.log('✅ COD selected - proceeding with direct order');
        await placeOrderDirectly('COD');
      } else if (form.payment === 'card' || form.payment === 'upi') {
        // For card/UPI, MUST use Razorpay - block any direct order creation
        console.log('📱 Non-COD payment selected:', form.payment, '- MUST open Razorpay');
        console.log('🔒 BLOCKING: will NOT submit order until Razorpay payment is verified');
        await handleRazorpayPayment();
      } else {
        // This should never happen, but if it does, alert user
        console.error('❌ INVALID PAYMENT METHOD:', form.payment);
        addToast(`Invalid payment method: "${form.payment}". Please select a valid payment option.`, 'error');
        setIsPlacingOrder(false);
      }
    } catch (error) {
      console.error('❌ Unexpected error in handlePlaceOrder:', error);
      addToast('An error occurred. Please try again.', 'error');
      setIsPlacingOrder(false);
    }
  };

  // Handle Razorpay payment flow
  const handleRazorpayPayment = async () => {
    console.log('🔄 [handleRazorpayPayment] Starting...');
    setIsPlacingOrder(true);
    try {
      // CRITICAL: Ensure Razorpay script is loaded before opening the payment modal.
      console.log('🔍 Checking Razorpay script availability...');
      try {
        await loadRazorpayScript();
        console.log('✅ [Script Check] Razorpay script is available');
      } catch (scriptError) {
        const errMsg = 'Razorpay payment script is not available. Please reload the page and try again.';
        console.error('❌ [Script Check]', errMsg, scriptError);
        addToast(errMsg, 'error');
        setIsPlacingOrder(false);
        return;
      }

      // Step 1: Create Razorpay order
      const amountInPaisa = Math.round(total * 100);
      console.log('🔔 [Order Creation] Creating Razorpay order...');
      console.log('💰 Amount:', total, 'INR |', amountInPaisa, 'paise');
      
      const createOrderResponse = await fetch(`${API_URL}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: 'INR',
          receipt: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })
      });

      console.log('📡 [Order Creation] Response status:', createOrderResponse.status);

      if (!createOrderResponse.ok) {
        const errorData = await createOrderResponse.json();
        const errMsg = `Server error: ${errorData.message || 'Failed to create payment order'}`;
        console.error('❌ [Order Creation]', errMsg);
        console.error('Server response:', errorData);
        addToast(errMsg, 'error');
        setIsPlacingOrder(false);
        return; // CRITICAL: Stop here, do NOT proceed
      }

      const responseData = await createOrderResponse.json();
      const { orderId, key } = responseData;
      
      console.log('✅ [Order Creation] Response received');
      console.log('Order ID:', orderId);
      console.log('Key ID:', key ? '***' + key.slice(-8) : 'MISSING');

      if (!orderId || !key) {
        const errMsg = 'Invalid response from payment server';
        console.error('❌ [Order Creation]', errMsg);
        console.error('Response data:', responseData);
        addToast(errMsg, 'error');
        setIsPlacingOrder(false);
        return; // CRITICAL: Stop here
      }

      console.log('✅ [Order Creation] Razorpay order created successfully:', orderId);

      // Step 2: Prepare Razorpay options
      const paymentMethod = form.payment === 'upi' ? 'upi' : 'card';
      console.log('💳 [Modal Setup] Payment method:', paymentMethod);

      const options = {
        key: key,
        amount: amountInPaisa,
        currency: 'INR',
        name: 'Vitthal Photo Frames',
        description: `Order for ${form.firstName} ${form.lastName}`,
        order_id: orderId,
        method: paymentMethod,
        handler: async (response) => {
          console.log('════════════════════════════════════════');
          console.log('✅ [Payment Handler] CALLBACK TRIGGERED!');
          console.log('════════════════════════════════════════');
          console.log('🔐 Received payment response object');
          console.log('Payment ID present:', !!response.razorpay_payment_id);
          console.log('Order ID present:', !!response.razorpay_order_id);
          console.log('Signature present:', !!response.razorpay_signature);
          
          if (response.razorpay_payment_id) {
            console.log('💳 Payment ID:', response.razorpay_payment_id.substring(0, 10) + '...');
          }
          
          try {
            console.log('🔍 [Verification] Verifying payment signature...');
            const verifyResponse = await fetch(`${API_URL}/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            console.log('📡 [Verification] Verification response status:', verifyResponse.status);

            if (!verifyResponse.ok) {
              const verifyError = await verifyResponse.json();
              const errMsg = verifyError.message || 'Payment verification failed';
              console.error('❌ [Verification]', errMsg);
              addToast('Payment verification failed: ' + errMsg, 'error');
              setIsPlacingOrder(false);
              return;
            }

            const verifyData = await verifyResponse.json();
            console.log('✅ [Verification] Verification response received');
            console.log('Verified:', verifyData.verified);

            if (verifyData.success && verifyData.verified) {
              console.log('✅ [Verification] Payment verified successfully!');
              console.log('🚀 [Order Creation] Proceeding to create order with verified payment...');
              // Payment is verified, now create the order
              await placeOrderDirectly('Razorpay', response.razorpay_payment_id);
            } else {
              const errMsg = 'Payment signature verification failed';
              console.error('❌ [Verification]', errMsg);
              addToast(errMsg, 'error');
              setIsPlacingOrder(false);
            }
          } catch (verifyError) {
            console.error('❌ [Verification Exception]:', verifyError);
            addToast('Payment verification error: ' + verifyError.message, 'error');
            setIsPlacingOrder(false);
          }
        },
        prefill: {
          name: `${form.firstName} ${form.lastName}`,
          email: form.email,
          contact: form.phone
        },
        theme: { color: '#E8AF39' },
        modal: {
          ondismiss: () => {
            console.log('⚠️  [Modal] User dismissed payment modal without completing payment');
            addToast('Payment cancelled. Please try again.', 'warning');
            setIsPlacingOrder(false);
          }
        }
      };

      // Step 3: Open Razorpay modal
      console.log('🎯 [Modal] Creating Razorpay instance...');
      let razorpay = null;
      try {
        razorpay = new window.Razorpay(options);
        console.log('✅ [Modal] Razorpay instance created successfully');
        console.log('🚀 [Modal] Calling razorpay.open()...');
        
        // Open the modal on the next tick so it is triggered from the current browser interaction path.
        const openResult = window.setTimeout(() => {
          try {
            razorpay.open();
            console.log('✅ [Modal] Payment modal should now be visible to user');
          } catch (openError) {
            console.error('❌ [Modal] Error while opening Razorpay modal:', openError);
            addToast('Unable to open the Razorpay payment window. Please try again.', 'error');
            setIsPlacingOrder(false);
          }
        }, 0);
        console.log('✅ [Modal] razorpay.open() scheduled:', openResult);
        
        // Don't reset isPlacingOrder here - wait for handler callback
        // The payment handler will call placeOrderDirectly when payment completes
      } catch (modalError) {
        const errMsg = `Failed to open payment modal: ${modalError.message}`;
        console.error('❌ [Modal] Exception when opening modal');
        console.error('❌ [Modal] Error name:', modalError.name);
        console.error('❌ [Modal] Error message:', modalError.message);
        console.error('❌ [Modal] Error stack:', modalError.stack);
        console.error('❌ [Modal] Full error object:', modalError);
        addToast(errMsg, 'error');
        setIsPlacingOrder(false);
        return;
      }
      
    } catch (error) {
      console.error('❌ [Fatal Error] Unexpected error in handleRazorpayPayment:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      addToast('Cannot open payment modal: ' + error.message, 'error');
      setIsPlacingOrder(false);
    }
  };

  // Place order in database
  const placeOrderDirectly = async (paymentMethod, paymentId = null) => {
    try {
      console.log('📋 [Order Submission] placeOrderDirectly called');
      console.log('📋 [Order Submission] Payment method:', paymentMethod);
      console.log('📋 [Order Submission] Payment ID present:', !!paymentId);
      
      // 🚫 ABSOLUTE SAFETY CHECK - BLOCK Card/UPI orders without verified payment
      if (paymentMethod === 'Card' || paymentMethod === 'UPI') {
        // For Card/UPI through Razorpay, paymentId MUST be present
        if (!paymentId) {
          const errorMsg = `🚫 SECURITY BLOCK: ${paymentMethod} order CANNOT be created without Razorpay payment verification!`;
          console.error('🚫 [Security Check]', errorMsg);
          console.error('🚫 [Security Check] paymentMethod:', paymentMethod);
          console.error('🚫 [Security Check] paymentId:', paymentId);
          addToast(`ERROR: Payment was not verified. Please complete payment through Razorpay modal.`, 'error');
          setIsPlacingOrder(false);
          return;
        }
      }

      // For Razorpay, paymentId MUST be present
      if (paymentMethod === 'Razorpay' && !paymentId) {
        const errorMsg = `🚫 SECURITY BLOCK: Razorpay payment MUST have paymentId!`;
        console.error('🚫 [Security Check]', errorMsg);
        addToast(`ERROR: Razorpay payment verification failed.`, 'error');
        setIsPlacingOrder(false);
        return;
      }

      // Only COD can proceed without paymentId
      if (paymentMethod !== 'COD' && paymentMethod !== 'Cash on Delivery' && !paymentId) {
        console.error('🚫 [Security Check] UNEXPECTED: Non-COD payment without paymentId');
        addToast('Payment verification required.', 'error');
        setIsPlacingOrder(false);
        return;
      }

      console.log('✅ [Security Check] Payment validation passed');

      const orderItems = cartItems.map(item => ({
        name: item.name,
        qty: item.quantity || 1,
        quantity: item.quantity || 1,
        image: normalizeImageUrl(item.image),
        price: item.price,
        product: item._id,
        size: item.size || 'Standard',
        customization: item.customizations || {
          hasCustomization: !!item.image,
          userUploadedImage: item.image || null,
          selectedSize: item.size || null,
          selectedFrame: item.frameStyle || null,
          selectedColor: item.color || null,
          material: item.material || null,
          glassFinish: item.glassFinish || null,
          mattingStyle: item.mattingStyle || null,
          orientation: item.orientation || null,
          textContent: item.textContent || null
        }
      }));

      const user = JSON.parse(localStorage.getItem('vitthal_user') || 'null');
      
      // Map payment method to proper format
      let finalPaymentMethod = paymentMethod;
      if (paymentMethod === 'Razorpay') {
        finalPaymentMethod = form.payment === 'card' ? 'Card' : 'UPI';
      } else if (paymentMethod === 'COD') {
        finalPaymentMethod = 'Cash on Delivery';
      }

      const orderData = {
        customerName: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        postalCode: form.pincode,
        orderItems,
        totalPrice: subtotal,
        paymentMethod: finalPaymentMethod,
        paymentId: paymentId || null,
        shippingAddress: { address: form.address, city: form.city, postalCode: form.pincode, country: 'India', phone: form.phone },
        userId: user?._id || user?.id || null,
        couponCode: coupon?.code || null,
        discountAmount: coupon?.discount || 0
      };

      // Validate orderData before sending
      console.log('🔍 [Order Submission] Validating order data...');
      const requiredFields = ['customerName', 'email', 'phone', 'address', 'city', 'postalCode', 'orderItems', 'totalPrice', 'paymentMethod'];
      const missingFields = requiredFields.filter(field => !orderData[field]);
      
      if (missingFields.length > 0) {
        console.error('❌ [Order Submission] Missing required fields:', missingFields);
        addToast(`Missing required fields: ${missingFields.join(', ')}`, 'error');
        setIsPlacingOrder(false);
        return;
      }

      if (!Array.isArray(orderData.orderItems) || orderData.orderItems.length === 0) {
        console.error('❌ [Order Submission] orderItems is empty or not an array');
        addToast('No items in order', 'error');
        setIsPlacingOrder(false);
        return;
      }

      if (typeof orderData.totalPrice !== 'number' || orderData.totalPrice <= 0) {
        console.error('❌ [Order Submission] Invalid totalPrice:', orderData.totalPrice);
        addToast('Invalid order total', 'error');
        setIsPlacingOrder(false);
        return;
      }

      console.log('✅ [Order Submission] All validations passed');

      console.log('📤 [Order Submission] Sending order to server...', {
        total: orderData.totalPrice,
        method: orderData.paymentMethod,
        hasPaymentId: !!orderData.paymentId
      });
      
      // Log the complete payload being sent
      console.log('📋 [Order Submission] Full order payload:', orderData);

      const token = localStorage.getItem('vitthal_token');
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(orderData)
      });

      console.log('📡 [Order Submission] Server response status:', res.status, res.statusText);

      if (res.ok) {
        const createdOrder = await res.json();
        console.log('✅ [Order Submission] Order created successfully:', createdOrder._id || createdOrder.id);
        addToast(`Order placed via ${finalPaymentMethod}!`, 'success');
        localStorage.removeItem('vitthal_cart');
        localStorage.removeItem('vitthal_coupon');
        window.dispatchEvent(new Event('cartUpdated'));
        setIsPlacingOrder(false);
        navigate('/order-success');
      } else {
        // Parse and log detailed error response
        let errorDetails = {};
        try {
          errorDetails = await res.json();
        } catch (e) {
          errorDetails = { message: `HTTP ${res.status}: ${res.statusText}` };
        }
        
        console.error('❌ [Order Submission] SERVER REJECTED ORDER');
        console.error('🚫 [Order Submission] Status:', res.status, res.statusText);
        console.error('🚫 [Order Submission] Error details:', errorDetails);
        console.error('🚫 [Order Submission] Order data that failed:', orderData);
        
        // Show detailed error to user
        const errorMessage = errorDetails.message || errorDetails.error || 'Order creation failed';
        addToast(`Error: ${errorMessage}`, 'error');
        setIsPlacingOrder(false);
      }
    } catch (error) {
      console.error('❌ [Order Submission] NETWORK ERROR');
      console.error('🚫 [Order Submission] Error message:', error.message);
      console.error('🚫 [Order Submission] Error stack:', error.stack);
      addToast('Network error: ' + error.message, 'error');
      setIsPlacingOrder(false);
    }
  };

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/">Home &gt;</Link> <Link to="/cart">Cart &gt;</Link> Checkout
      </div>

      <div className="checkout-container">
        <h1>Checkout</h1>
        <br />
        <div className="checkout-layout">

          {/* LEFT – Billing Form */}
          <div className="checkout-form">
            <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>Billing Details</h3>
            <form onSubmit={handlePlaceOrder}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" placeholder="John" required style={inp} value={form.firstName} onChange={set('firstName')} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" placeholder="Doe" required style={inp} value={form.lastName} onChange={set('lastName')} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Phone Number</label>
                <input type="tel" placeholder="+91 9876543210" required style={inp} value={form.phone} onChange={set('phone')} />
              </div>
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Email Address</label>
                <input type="email" placeholder="john@example.com" required style={inp} value={form.email} onChange={set('email')} />
              </div>
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Shipping Address</label>
                <textarea rows="3" placeholder="Street address, apartment, etc." required style={{ ...inp, resize: 'vertical' }} value={form.address} onChange={set('address')} />
              </div>
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>City</label>
                <input type="text" placeholder="Mumbai" required style={inp} value={form.city} onChange={set('city')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div className="form-group">
                  <label>State</label>
                  <input type="text" placeholder="Maharashtra" required style={inp} value={form.state} onChange={set('state')} />
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <input type="text" placeholder="400001" required style={inp} value={form.pincode} onChange={set('pincode')} />
                </div>
              </div>

              <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px', marginTop: '40px' }}>Payment Method</h3>
              <div className="payment-options">
                {[
                  { value: 'card', icon: 'bi-credit-card-2-front', label: 'Credit / Debit Card' },
                  { value: 'upi', icon: 'bi-phone', label: 'UPI / PhonePe / GPay' },
                  { value: 'cod', icon: 'bi-cash-stack', label: 'Cash on Delivery' },
                ].map(p => (
                  <label key={p.value} className="payment-card" style={{ cursor: 'pointer' }}>
                    <input type="radio" name="payment" value={p.value} checked={form.payment === p.value} onChange={set('payment')} />
                    <div className="payment-card-content">
                      <div className="payment-info">
                        <i className={`bi ${p.icon}`}></i>
                        <span>{p.label}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <button type="submit" className="checkout-btn"
                style={{ marginTop: '30px', width: '100%', padding: '15px', fontSize: '1.1rem' }}
                disabled={isPlacingOrder}>
                {isPlacingOrder ? 'Processing...' : `Place Order - ₹${total.toLocaleString()}`}
              </button>
            </form>
          </div>

          {/* RIGHT – Order Summary */}
          <div className="checkout-summary">
            <h3>Your Order</h3>
            <div style={{ marginTop: '20px', marginBottom: '30px' }}>
              {cartItems.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem' }}>{item.name}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#666' }}>Qty: {item.quantity || 1} | Size: {item.size || 'Standard'}</span>
                    </div>
                  </div>
                  <strong style={{ alignSelf: 'center' }}>₹{(item.price * (item.quantity || 1)).toLocaleString()}</strong>
                </div>
              ))}
            </div>
            <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            {coupon && (
              <div className="summary-row" style={{ color: 'green' }}>
                <span>Discount ({coupon.code})</span>
                <span>-₹{coupon.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="summary-row"><span>Shipping</span><span>Free</span></div>
            <div className="summary-row total"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Checkout;
