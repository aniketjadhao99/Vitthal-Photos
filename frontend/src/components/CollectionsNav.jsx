import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const CollectionsNav = () => {
  const location = useLocation();

  const collections = [
    { path: '/god', label: 'God' },
    { path: '/warriors', label: 'Warrior' },
    { path: '/collage', label: 'Collage' },
    { path: '/family', label: 'Family' },
    { path: '/kids', label: 'Kids' },
    { path: '/custom', label: 'Custom' }
  ];

  return (
    <nav className="collections-nav" style={{
      backgroundColor: '#fff',
      padding: '12px 20px',
      marginBottom: '40px',
      borderBottom: '1px solid #e8e8e8'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          overflowX: 'auto',
          flexWrap: 'wrap'
        }}>
          {collections.map((collection) => (
            <Link
              key={collection.path}
              to={collection.path}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '0.9rem',
                color: location.pathname === collection.path ? '#fff' : '#333',
                backgroundColor: location.pathname === collection.path ? '#8a7560' : '#f0f0f0',
                border: 'none',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== collection.path) {
                  e.currentTarget.style.backgroundColor = '#e8e8e8';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== collection.path) {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                }
              }}
            >
              {collection.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default CollectionsNav;
