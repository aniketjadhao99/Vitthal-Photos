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

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsPlacingOrder(true);

    const orderItems = cartItems.map(item => ({
      name: item.name,
      qty: item.quantity || 1,
      quantity: item.quantity || 1,
      image: item.image,
      price: item.price,
      product: item._id,
      size: item.size || 'Standard',
    }));

    const user = JSON.parse(localStorage.getItem('vitthal_user') || 'null');
    const orderData = {
      customerName: `${form.firstName} ${form.lastName}`.trim(),
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      postalCode: form.pincode,
      orderItems,
      totalPrice: subtotal,
      paymentMethod: form.payment,
      shippingAddress: { address: form.address, city: form.city, postalCode: form.pincode, country: 'India', phone: form.phone },
      userId: user?._id || user?.id || null,
      couponCode: coupon?.code || null,
      discountAmount: coupon?.discount || 0
    };

    try {
      const token = localStorage.getItem('vitthal_token');
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(orderData)
      });

      if (res.ok) {
        addToast(`Order placed via ${form.payment.toUpperCase()}!`, 'success');
      } else {
        const err = await res.json();
        addToast(err.message || 'Order failed. Try again.', 'error');
        setIsPlacingOrder(false);
        return;
      }
    } catch {
      addToast('Order placed! (Offline Mode)', 'success');
    }

    localStorage.removeItem('vitthal_cart');
    localStorage.removeItem('vitthal_coupon');
    window.dispatchEvent(new Event('cartUpdated'));
    setIsPlacingOrder(false);
    navigate('/order-success');
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
