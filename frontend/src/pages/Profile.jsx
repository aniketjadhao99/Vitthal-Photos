import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import '../styles/Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('vitthal_token');
    const storedUser = JSON.parse(localStorage.getItem('vitthal_user'));
    
    if (!token || !storedUser) {
        addToast('Please login to access your profile', 'error');
        navigate('/login');
        return;
    }
    
    setUser(storedUser);
    setName(storedUser.name || '');
    setEmail(storedUser.email || '');

    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders/myorders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    const fetchAddresses = async () => {
      try {
        const res = await fetch('/api/addresses', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAddresses(data);
        }
      } catch (err) {
        console.error('Error fetching addresses:', err);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchOrders();
    fetchAddresses();
  }, [navigate, addToast]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    const token = localStorage.getItem('vitthal_token');
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('vitthal_user', JSON.stringify(data));
        setUser(data);
        addToast('Profile updated successfully!', 'success');
      } else {
        const err = await res.json();
        addToast(err.message || 'Update failed', 'error');
      }
    } catch (err) {
      addToast('Network error while updating profile', 'error');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('vitthal_token');
      localStorage.removeItem('vitthal_user');
      addToast('Logged out successfully', 'success');
      navigate('/');
    }
  };

  const badge = (status = '') => {
    const s = status.toLowerCase();
    const map = {
      pending:    { bg: '#fff3cd', color: '#856404' },
      processing: { bg: '#d1ecf1', color: '#0c5460' },
      shipped:    { bg: '#cce5ff', color: '#004085' },
      delivered:  { bg: '#d4edda', color: '#155724' },
      cancelled:  { bg: '#f8d7da', color: '#721c24' },
    };
    const style = map[s] || { bg: '#eee', color: '#333' };
    return (
      <span style={{ background: style.bg, color: style.color, padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
        {status}
      </span>
    );
  };

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ id: null, name: '', phone: '', address: '', city: '', state: '', postalCode: '', isDefault: false });
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnForm, setReturnForm] = useState({ reason: 'Defective product', description: '' });

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('vitthal_token');
    const url = addressForm.id ? `/api/addresses/${addressForm.id}` : '/api/addresses';
    const method = addressForm.id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(addressForm)
      });
      if (res.ok) {
        addToast(`Address ${addressForm.id ? 'updated' : 'added'} successfully!`, 'success');
        setShowAddressForm(false);
        // Refresh addresses
        const newRes = await fetch('/api/addresses', { headers: { 'Authorization': `Bearer ${token}` } });
        if (newRes.ok) setAddresses(await newRes.json());
      } else {
        const err = await res.json();
        addToast(err.message || 'Error saving address', 'error');
      }
    } catch (error) {
      addToast('Network error saving address', 'error');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    const token = localStorage.getItem('vitthal_token');
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Address deleted', 'success');
        setAddresses(addresses.filter(a => a._id !== id));
      }
    } catch (error) {
      addToast('Error deleting address', 'error');
    }
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('vitthal_token');
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ orderId: selectedOrder._id, ...returnForm })
      });
      if (res.ok) {
        addToast('Return request submitted successfully', 'success');
        setShowReturnModal(false);
        setShowModal(false);
      } else {
        const err = await res.json();
        addToast(err.message || 'Error submitting return', 'error');
      }
    } catch (error) {
      addToast('Network error', 'error');
    }
  };

  if (!user) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading profile...</div>;

  return (
    <>
      <div className="breadcrumbs" style={{ padding: '20px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <Link to="/">Home &gt;</Link> My Profile
      </div>

      <div className="profile-page-container">
        <div className="profile-intro">
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #fa873b, #e0702b)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2.5rem', fontWeight: 800, color: 'white', boxShadow: '0 10px 30px rgba(250, 135, 59, 0.3)' }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '10px', fontWeight: 800 }}>Hello, {user.name}!</h1>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>Manage your account and track your orders</p>
        </div>

        <div className="profile-stat-grid">
          <Link to="/wishlist" style={{ background: 'white', borderRadius: '16px', padding: '25px', textAlign: 'center', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', textDecoration: 'none', color: '#333', transition: 'transform 0.3s' }}>
            <i className="bi bi-heart" style={{ fontSize: '2rem', color: '#fa873b', marginBottom: '12px', display: 'block' }}></i>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '5px' }}>My Wishlist</h3>
            <p style={{ fontSize: '0.85rem', color: '#888' }}>Your saved items</p>
          </Link>
          <Link to="/cart" style={{ background: 'white', borderRadius: '16px', padding: '25px', textAlign: 'center', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', textDecoration: 'none', color: '#333', transition: 'transform 0.3s' }}>
            <i className="bi bi-cart" style={{ fontSize: '2rem', color: '#fa873b', marginBottom: '12px', display: 'block' }}></i>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '5px' }}>My Cart</h3>
            <p style={{ fontSize: '0.85rem', color: '#888' }}>Items ready to buy</p>
          </Link>
          <a href="#order-history" style={{ background: 'white', borderRadius: '16px', padding: '25px', textAlign: 'center', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', textDecoration: 'none', color: '#333', transition: 'transform 0.3s' }}>
            <i className="bi bi-box-seam" style={{ fontSize: '2rem', color: '#fa873b', marginBottom: '12px', display: 'block' }}></i>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '5px' }}>My Orders</h3>
            <p style={{ fontSize: '0.85rem', color: '#888' }}>{orders.length} orders placed</p>
          </a>
        </div>

        <div className="profile-main-grid">
            
            {/* Order History */}
            <div id="order-history" className="profile-card">
                <h2 style={{ fontSize: '1.4rem', color: '#333', marginBottom: '25px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="bi bi-clock-history" style={{ color: '#fa873b', fontSize: '1.3rem' }}></i> Order History
                </h2>
                
                {loadingOrders ? (
                  <p>Loading your orders...</p>
                ) : orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: '#888', marginBottom: '20px' }}>You haven't placed any orders yet.</p>
                    <Link to="/god" style={{ color: '#fa873b', fontWeight: 700, textDecoration: 'none' }}>Start Shopping &rarr;</Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {orders.map(order => (
                      <div key={order._id} style={{ border: '1px solid #eee', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', marginBottom: '15px', borderBottom: '1px solid #f9f9f9', paddingBottom: '10px' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#999', display: 'block' }}>Order ID</span>
                            <strong style={{ fontSize: '0.9rem' }}>#{order._id.slice(-8).toUpperCase()}</strong>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#999', display: 'block' }}>Date</span>
                            <strong style={{ fontSize: '0.9rem' }}>{new Date(order.createdAt).toLocaleDateString()}</strong>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.8rem', color: '#999', display: 'block' }}>Status</span>
                            {badge(order.status)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                          {order.orderItems.map((item, i) => (
                            <img key={i} src={normalizeImageUrl(item.product?.images?.[0] || item.customization?.userUploadedImage || 'https://via.placeholder.com/50')} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />
                          ))}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{order.totalPrice.toLocaleString()}</span>
                          <button 
                            onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                            style={{ background: 'none', border: '1px solid #ddd', padding: '6px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* Profile Settings */}
            <div className="profile-card">
                <h2 style={{ fontSize: '1.4rem', color: '#333', marginBottom: '25px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="bi bi-person-circle" style={{ color: '#fa873b', fontSize: '1.3rem' }}></i> Profile Settings
                </h2>
                <form onSubmit={handleProfileUpdate}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontWeight: 600, color: '#555', marginBottom: '8px', fontSize: '0.9rem' }}>Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '12px 15px', border: '1px solid #eee', borderRadius: '10px', fontSize: '0.95rem', background: '#fafafa', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', fontWeight: 600, color: '#555', marginBottom: '8px', fontSize: '0.9rem' }}>Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px 15px', border: '1px solid #eee', borderRadius: '10px', fontSize: '0.95rem', background: '#fafafa', boxSizing: 'border-box' }} />
                    </div>
                    <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #fa873b, #e0702b)', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(250, 135, 59, 0.25)' }}>
                        Save Changes
                    </button>
                </form>
                
                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                  <button onClick={handleLogout} style={{ background: 'none', color: '#e74c3c', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                    <i className="bi bi-box-arrow-right"></i> Logout Account
                  </button>
                </div>
                {/* Addresses Section */}
            <div className="profile-card" style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#333', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="bi bi-geo-alt" style={{ color: '#fa873b', fontSize: '1.3rem' }}></i> Saved Addresses
                </h2>
                <button onClick={() => { setAddressForm({ id: null, name: '', phone: '', address: '', city: '', state: '', postalCode: '', isDefault: false }); setShowAddressForm(true); }} style={{ background: '#fa873b', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>+ Add New</button>
              </div>

              {loadingAddresses ? <p>Loading addresses...</p> : addresses.length === 0 ? <p style={{ color: '#888' }}>No saved addresses.</p> : (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {addresses.map(addr => (
                    <div key={addr._id} style={{ border: '1px solid #eee', borderRadius: '12px', padding: '15px', position: 'relative' }}>
                      {addr.isDefault && <span style={{ position: 'absolute', top: '15px', right: '15px', background: '#e8f5e9', color: '#2e7d32', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>Default</span>}
                      <h4 style={{ margin: '0 0 5px 0' }}>{addr.name}</h4>
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#555' }}>{addr.phone}</p>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666', lineHeight: '1.4' }}>{addr.address}, {addr.city}, {addr.state} - {addr.postalCode}</p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => { setAddressForm({ id: addr._id, ...addr }); setShowAddressForm(true); }} style={{ background: 'none', border: '1px solid #ddd', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>
                        <button onClick={() => handleDeleteAddress(addr._id)} style={{ background: 'none', border: '1px solid #ffcdd2', color: '#d32f2f', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </div>

        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="profile-modal" style={{ background: 'white', borderRadius: '25px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '40px', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '5px' }}>Order Details</h2>
            <p style={{ color: '#888', marginBottom: '30px' }}>Order ID: #{selectedOrder._id.toUpperCase()}</p>
            
            <div className="profile-order-details-grid">
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Status</span>
                {badge(selectedOrder.status)}
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Payment</span>
                <span style={{ fontWeight: 700 }}>{selectedOrder.paymentMethod}</span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Shipping Address</span>
                <span style={{ lineHeight: '1.5', color: '#444' }}>{selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city} - {selectedOrder.shippingAddress?.postalCode}</span>
              </div>
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>Items Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {selectedOrder.orderItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid #f9f9f9' }}>
                  <img loading="lazy" decoding="async" src={normalizeImageUrl(item.product?.images?.[0] || item.customization?.userUploadedImage || 'https://via.placeholder.com/80')} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>{item.name}</h4>
                    <span style={{ fontSize: '0.85rem', color: '#777' }}>Qty: {item.quantity} | Size: {item.customization?.selectedSize || item.size || 'Standard'}</span>
                  </div>
                  <strong style={{ fontSize: '1.1rem' }}>₹{(item.price * item.quantity).toLocaleString()}</strong>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px dashed #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Total Amount Paid</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fa873b' }}>₹{selectedOrder.totalPrice.toLocaleString()}</span>
            </div>

            {selectedOrder.status?.toLowerCase() === 'delivered' && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button 
                  onClick={() => setShowReturnModal(true)}
                  style={{ background: 'white', border: '1px solid #fa873b', color: '#fa873b', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Request Return / Refund
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Address Form Modal */}
      {showAddressForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="profile-modal-small" style={{ background: 'white', borderRadius: '20px', width: '100%', padding: '30px', position: 'relative' }}>
            <button onClick={() => setShowAddressForm(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            <h2 style={{ marginBottom: '20px' }}>{addressForm.id ? 'Edit Address' : 'Add New Address'}</h2>
            <form onSubmit={handleSaveAddress}>
              <div className="profile-address-form-grid">
                <div><label>Name</label><input required type="text" value={addressForm.name} onChange={e => setAddressForm({...addressForm, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
                <div><label>Phone</label><input required type="text" value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
              </div>
              <div style={{ marginBottom: '15px' }}><label>Address</label><textarea required rows="3" value={addressForm.address} onChange={e => setAddressForm({...addressForm, address: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
              <div className="profile-address-form-grid">
                <div><label>City</label><input required type="text" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
                <div><label>State</label><input required type="text" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
              </div>
              <div style={{ marginBottom: '15px' }}><label>Postal Code</label><input required type="text" value={addressForm.postalCode} onChange={e => setAddressForm({...addressForm, postalCode: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm({...addressForm, isDefault: e.target.checked})} /> Set as default address
              </label>
              <button type="submit" style={{ width: '100%', background: '#fa873b', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Save Address</button>
            </form>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="profile-modal-small" style={{ background: 'white', borderRadius: '20px', width: '100%', padding: '30px', position: 'relative' }}>
            <button onClick={() => setShowReturnModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            <h2 style={{ marginBottom: '10px' }}>Request Return</h2>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.9rem' }}>You are requesting a return for Order #{selectedOrder?._id?.slice(-8).toUpperCase()}</p>
            <form onSubmit={handleSubmitReturn}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Reason for Return</label>
                <select required value={returnForm.reason} onChange={e => setReturnForm({...returnForm, reason: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                  <option>Defective product</option>
                  <option>Wrong item received</option>
                  <option>Item damaged in transit</option>
                  <option>Not satisfied with quality</option>
                  <option>Other</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Additional Details</label>
                <textarea required rows="4" value={returnForm.description} onChange={e => setReturnForm({...returnForm, description: e.target.value})} placeholder="Please provide more details about the issue..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
              </div>
              <button type="submit" style={{ width: '100%', background: '#d32f2f', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Submit Return Request</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
