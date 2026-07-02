import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/Toast';

const API_URL = '/api';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? `${API_URL}/users/login` : `${API_URL}/users/register`;
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Successful login/registration
      localStorage.setItem('vitthal_token', data.token);
      localStorage.setItem('vitthal_user', JSON.stringify({ 
        _id: data._id || data.id,
        id: data._id || data.id,
        name: data.name, 
        email: data.email,
        isAdmin: data.isAdmin,
        role: data.isAdmin ? 'admin' : 'user'
      }));
      
      addToast(isLogin ? 'Successfully logged in!' : 'Account created successfully!', 'success');
      
      if (data.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/profile');
      }
      
    } catch (err) {
      addToast(err.message || 'Authentication failed', 'error');
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#fafafa' }}>
      <div className="auth-card" style={{ background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', width: '100%', maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img src="/assets/images/logo.png" alt="Logo" style={{ height: '60px', marginBottom: '20px' }} />
          <h1 style={{ fontSize: '2rem', color: '#333', fontWeight: 800 }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p style={{ color: '#666', marginTop: '10px' }}>
            {isLogin ? 'Sign in to access your orders and wishlist.' : 'Join us to save your favorite frames and track orders.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#555' }}>Full Name</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder="John Doe" 
                required={!isLogin}
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '2px solid #eee', fontSize: '1rem', boxSizing: 'border-box' }}
              />
            </div>
          )}
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#555' }}>Email Address</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleInputChange} 
              placeholder="you@example.com" 
              required
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '2px solid #eee', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#555' }}>Password</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleInputChange} 
              placeholder="••••••••" 
              required
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '2px solid #eee', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '16px', 
              background: 'linear-gradient(135deg, #fa873b, #e0702b)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '10px', 
              fontSize: '1.1rem', 
              fontWeight: 700, 
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px',
              boxShadow: '0 8px 20px rgba(250, 135, 59, 0.25)'
            }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '30px', color: '#666' }}>
          {isLogin ? (
            <p>Don't have an account? <button onClick={() => setIsLogin(false)} style={{ background: 'none', border: 'none', color: '#fa873b', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Sign Up</button></p>
          ) : (
            <p>Already have an account? <button onClick={() => setIsLogin(true)} style={{ background: 'none', border: 'none', color: '#fa873b', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Sign In</button></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
