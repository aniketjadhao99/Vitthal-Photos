import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{ 
      padding: '120px 20px', 
      textAlign: 'center', 
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ fontSize: '10rem', margin: 0, color: '#f0f0f0', fontWeight: '900', lineHeight: '1' }}>404</h1>
      <h2 style={{ fontSize: '2.5rem', marginTop: '-30px', marginBottom: '20px' }}>Oops! Page Not Found</h2>
      <p style={{ color: '#666', maxWidth: '500px', marginBottom: '40px', fontSize: '1.1rem' }}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/" style={{
        padding: '15px 40px',
        background: '#1a1a1a',
        color: 'white',
        borderRadius: '50px',
        textDecoration: 'none',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
        boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
      }}>
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
