import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('vitthal_cart')) || [];
    setCartItems(cart);
    
    const savedCoupon = JSON.parse(localStorage.getItem('vitthal_coupon'));
    if (savedCoupon && savedCoupon.discount) {
      setCouponCode(savedCoupon.code);
      setDiscount(savedCoupon.discount);
      setCouponMessage({ type: 'success', text: `Coupon ${savedCoupon.code} applied!` });
    }
  }, []);

  const updateQuantity = (index, delta) => {
    const updatedCart = [...cartItems];
    const newQty = (updatedCart[index].quantity || 1) + delta;
    if (newQty > 0) {
      updatedCart[index].quantity = newQty;
      setCartItems(updatedCart);
      localStorage.setItem('vitthal_cart', JSON.stringify(updatedCart));
      window.dispatchEvent(new Event('cartUpdated'));
    }
  };

  const removeItem = (index) => {
    const updatedCart = [...cartItems];
    updatedCart.splice(index, 1);
    setCartItems(updatedCart);
    localStorage.setItem('vitthal_cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);

  const applyCoupon = async () => {
    if (!couponCode) return;
    setCouponMessage({ type: '', text: 'Validating...' });
    
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, orderTotal: subtotal })
      });
      const data = await res.json();
      
      if (res.ok) {
        setDiscount(data.discount);
        setCouponMessage({ type: 'success', text: `Coupon applied! You saved ₹${data.discount.toLocaleString()}` });
        localStorage.setItem('vitthal_coupon', JSON.stringify({ code: data.code, discount: data.discount }));
      } else {
        setDiscount(0);
        setCouponMessage({ type: 'error', text: data.message || 'Invalid coupon' });
        localStorage.removeItem('vitthal_coupon');
      }
    } catch (err) {
      setCouponMessage({ type: 'error', text: 'Error validating coupon' });
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscount(0);
    setCouponMessage({ type: '', text: '' });
    localStorage.removeItem('vitthal_coupon');
  };

  const total = Math.max(0, subtotal - discount);

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/">Home &gt;</Link> Shopping Cart
      </div>

      <div className="cart-container">
        <h1>Your Shopping Cart</h1>
        <br />
        
        {cartItems.length > 0 ? (
          <>
            {/* Desktop View (Table) */}
            <div className="cart-desktop-view table-responsive">
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="cart-product">
                          <img src={item.image} alt={item.name} />
                          <div>
                            <h4 style={{ margin: 0 }}>{item.name}</h4>
                            <small>Size: {item.size || 'Standard'}</small>
                          </div>
                        </div>
                      </td>
                      <td>₹{item.price?.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button onClick={() => updateQuantity(index, -1)} style={{ padding: '5px 10px', cursor: 'pointer' }}>-</button>
                          <span className="quantity-input" style={{ display: 'inline-block', lineHeight: '28px' }}>{item.quantity || 1}</span>
                          <button onClick={() => updateQuantity(index, 1)} style={{ padding: '5px 10px', cursor: 'pointer' }}>+</button>
                        </div>
                      </td>
                      <td>₹{(item.price * (item.quantity || 1)).toLocaleString()}</td>
                      <td>
                        <button className="remove-btn" onClick={() => removeItem(index)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="cart-mobile-view">
              {cartItems.map((item, index) => (
                <div className="cart-mobile-card" key={index}>
                  <button className="cart-mobile-remove" onClick={() => removeItem(index)}>
                    <i className="bi bi-trash"></i>
                  </button>
                  <div className="cart-mobile-product-info">
                    <img src={item.image} alt={item.name} />
                    <div className="cart-mobile-details">
                      <h4>{item.name}</h4>
                      <small>Size: {item.size || 'Standard'}</small>
                      <span className="cart-mobile-price">₹{item.price?.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="cart-mobile-actions">
                    <div className="cart-mobile-quantity">
                      <button onClick={() => updateQuantity(index, -1)}>-</button>
                      <span>{item.quantity || 1}</span>
                      <button onClick={() => updateQuantity(index, 1)}>+</button>
                    </div>
                    <div className="cart-mobile-total">
                      <span>Total</span>
                      <strong>₹{(item.price * (item.quantity || 1)).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <h2>Your cart is empty.</h2>
            <p>Looks like you haven't added any frames yet.</p>
            <button onClick={() => navigate('/god')} className="checkout-btn" style={{ maxWidth: '200px', margin: '20px auto' }}>Shop Now</button>
          </div>
        )}

        {cartItems.length > 0 && (
          <div className="cart-summary" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="coupon-section" style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px' }}>
              <h4 style={{ marginBottom: '10px' }}>Apply Coupon</h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code" 
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  disabled={discount > 0}
                />
                {discount > 0 ? (
                  <button onClick={removeCoupon} style={{ padding: '10px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Remove</button>
                ) : (
                  <button onClick={applyCoupon} style={{ padding: '10px 15px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Apply</button>
                )}
              </div>
              {couponMessage.text && (
                <p style={{ color: couponMessage.type === 'success' ? 'green' : 'red', fontSize: '0.9rem', marginTop: '10px', marginBottom: 0 }}>
                  {couponMessage.text}
                </p>
              )}
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
              <h3>Order Summary</h3>
              <div className="summary-row" style={{ marginTop: '15px' }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="summary-row" style={{ color: 'green' }}>
                  <span>Discount</span>
                  <span>-₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="summary-row total" style={{ borderTop: '2px solid #eee', paddingTop: '15px', marginTop: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
              <button className="checkout-btn" style={{ width: '100%', marginTop: '20px', padding: '15px', borderRadius: '8px', fontSize: '1.1rem' }} onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;
