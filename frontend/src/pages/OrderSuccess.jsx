import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const OrderSuccess = () => {
  const location = useLocation();
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    // Generate a mock order ID if not present
    const id = location.state?.orderId || 'VIT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setOrderId(id);
    
    // Scroll to top
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="order-success-page" style={{ 
      padding: '100px 20px', 
      textAlign: 'center',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #fffcf5 0%, #fff 100%)'
    }}>
      <div className="success-icon" style={{
        fontSize: '80px',
        color: '#4CAF50',
        marginBottom: '20px',
        animation: 'bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }}>
        <i className="bi bi-check-circle-fill"></i>
      </div>
      
      <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px', color: '#1a1a1a' }}>Order Placed Successfully!</h1>
      <p style={{ fontSize: '1.2rem', color: '#666', maxWidth: '600px', margin: '0 auto 30px' }}>
        Thank you for your purchase. Your order has been received and is being processed.
      </p>
      
      <div className="order-details-card" style={{
        background: 'white',
        padding: '30px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        width: '100%',
        maxWidth: '500px',
        marginBottom: '40px',
        border: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
          <span style={{ color: '#888' }}>Order ID:</span>
          <strong style={{ color: '#fa873b' }}>#{orderId}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
          <span style={{ color: '#888' }}>Estimated Delivery:</span>
          <strong>5-7 Business Days</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#888' }}>Status:</span>
          <span style={{ 
            padding: '4px 12px', 
            background: '#e8f5e9', 
            color: '#2e7d32', 
            borderRadius: '20px', 
            fontSize: '0.85rem',
            fontWeight: 'bold'
          }}>Confirmed</span>
        </div>
      </div>
      
      <div className="success-actions" style={{ display: 'flex', gap: '20px' }}>
        <Link to="/" className="btn-primary" style={{
          padding: '15px 30px',
          background: '#fa873b',
          color: 'white',
          borderRadius: '12px',
          textDecoration: 'none',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          boxShadow: '0 5px 15px rgba(250, 135, 59, 0.3)'
        }}>Continue Shopping</Link>
        <Link to="/profile" className="btn-secondary" style={{
          padding: '15px 30px',
          background: 'white',
          color: '#1a1a1a',
          border: '2px solid #1a1a1a',
          borderRadius: '12px',
          textDecoration: 'none',
          fontWeight: '600',
          transition: 'all 0.3s ease'
        }}>View My Orders</Link>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(250, 135, 59, 0.4);
        }
        .btn-secondary:hover {
          background: #1a1a1a;
          color: white;
          transform: translateY(-3px);
        }
      `}} />
    </div>
  );
};

export default OrderSuccess;
