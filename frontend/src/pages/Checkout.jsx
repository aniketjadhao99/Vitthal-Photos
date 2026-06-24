import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

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
    setCartItems(cart);
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

  // Handle order placement - decides between COD and Razorpay
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.address || !form.city || !form.pincode) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    // Prevent double submission
    if (isPlacingOrder) {
      addToast('Please wait, processing your order...', 'info');
      return;
    }
    
    console.log('Form submitted with payment method:', form.payment);
    
    // For COD, place order directly
    if (form.payment === 'cod') {
      console.log('COD selected - proceeding with direct order');
      await placeOrderDirectly('COD');
    } else if (form.payment === 'card' || form.payment === 'upi') {
      // For card/UPI, MUST use Razorpay - block any direct order creation
      console.log('Payment method selected:', form.payment, '- opening Razorpay');
      await handleRazorpayPayment();
    } else {
      addToast('Please select a payment method', 'error');
    }
  };

  // Handle Razorpay payment flow
  const handleRazorpayPayment = async () => {
    setIsPlacingOrder(true);
    try {
      // CRITICAL: Check Razorpay script is loaded
      console.log('Checking Razorpay availability...');
      let razorpayReady = false;
      
      for (let i = 0; i < 20; i++) {
        if (window.Razorpay) {
          razorpayReady = true;
          console.log('✅ Razorpay confirmed ready on attempt', i + 1);
          break;
        }
        await new Promise(r => setTimeout(r, 100));
      }

      if (!razorpayReady) {
        throw new Error('Razorpay payment script is not available. Please reload the page and try again.');
      }

      // Step 1: Create Razorpay order
      const amountInPaisa = Math.round(total * 100);
      console.log('🔔 Creating Razorpay order...');
      console.log('Amount:', total, 'INR |', amountInPaisa, 'paise');
      
      const createOrderResponse = await fetch(`${API_URL}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: 'INR',
          receipt: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })
      });

      if (!createOrderResponse.ok) {
        const errorData = await createOrderResponse.json();
        throw new Error(`Server error: ${errorData.message || 'Failed to create payment order'}`);
      }

      const responseData = await createOrderResponse.json();
      const { orderId, key } = responseData;
      
      if (!orderId || !key) {
        console.error('Invalid response:', responseData);
        throw new Error('Invalid response from payment server');
      }

      console.log('✅ Razorpay order created:', orderId);

      // Step 2: Prepare Razorpay options
      const paymentMethod = form.payment === 'upi' ? 'upi' : 'card';
      console.log('Method selected:', paymentMethod);

      const options = {
        key: key,
        amount: amountInPaisa,
        currency: 'INR',
        name: 'Vitthal Photo Frames',
        description: `Order for ${form.firstName} ${form.lastName}`,
        order_id: orderId,
        method: paymentMethod,
        handler: async (response) => {
          console.log('✅ Payment handler called');
          console.log('Payment IDs:', response);
          
          try {
            const verifyResponse = await fetch(`${API_URL}/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (!verifyResponse.ok) {
              const verifyError = await verifyResponse.json();
              throw new Error(verifyError.message || 'Payment verification failed');
            }

            const verifyData = await verifyResponse.json();
            if (verifyData.success && verifyData.verified) {
              console.log('✅ Payment verified!');
              await placeOrderDirectly('Razorpay', response.razorpay_payment_id);
            } else {
              throw new Error('Payment signature verification failed');
            }
          } catch (verifyError) {
            console.error('❌ Verification failed:', verifyError);
            addToast('Payment verification failed: ' + verifyError.message, 'error');
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
            console.log('❌ User dismissed payment modal');
            addToast('Payment cancelled. Please try again.', 'warning');
            setIsPlacingOrder(false);
          }
        }
      };

      // Step 3: Open Razorpay modal
      console.log('🚀 Opening Razorpay modal...');
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('❌ Fatal error:', error.message);
      addToast('Cannot open payment modal: ' + error.message, 'error');
      setIsPlacingOrder(false);
    }
  };

  // Place order in database
  const placeOrderDirectly = async (paymentMethod, paymentId = null) => {
    try {
      // CRITICAL VALIDATION: Razorpay/Card/UPI orders MUST have paymentId
      if ((paymentMethod === 'Razorpay' || paymentMethod === 'Card' || paymentMethod === 'UPI') && !paymentId) {
        const errorMsg = `${paymentMethod} payment requires payment ID. Please complete payment first.`;
        console.error('❌', errorMsg);
        addToast(errorMsg, 'error');
        setIsPlacingOrder(false);
        return;
      }

      console.log('Creating order:', {
        method: paymentMethod,
        hasPaymentId: !!paymentId,
        paymentId: paymentId ? '[REDACTED]' : 'NONE'
      });

      const orderItems = cartItems.map(item => ({
        name: item.name,
        qty: item.quantity || 1,
        quantity: item.quantity || 1,
        image: item.image,
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

      console.log('📤 Sending order to server...', {
        total: orderData.totalPrice,
        method: orderData.paymentMethod,
        hasPaymentId: !!orderData.paymentId
      });

      const token = localStorage.getItem('vitthal_token');
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(orderData)
      });

      if (res.ok) {
        const createdOrder = await res.json();
        console.log('✅ Order created successfully:', createdOrder._id || createdOrder.id);
        addToast(`Order placed via ${finalPaymentMethod}!`, 'success');
        localStorage.removeItem('vitthal_cart');
        localStorage.removeItem('vitthal_coupon');
        window.dispatchEvent(new Event('cartUpdated'));
        setIsPlacingOrder(false);
        navigate('/order-success');
      } else {
        const err = await res.json();
        console.error('❌ Server rejected order:', err);
        addToast(err.message || 'Order failed. Try again.', 'error');
        setIsPlacingOrder(false);
      }
    } catch (error) {
      console.error('❌ Order placement error:', error.message);
      addToast('Error placing order: ' + error.message, 'error');
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
