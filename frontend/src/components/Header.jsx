import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from './Toast';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('vitthal_user') || 'null');
    setIsAdmin(user?.isAdmin || user?.role === 'admin' || false);
  }, [location]);

  useEffect(() => {
    // Basic sync from localStorage for cart count
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('vitthal_cart')) || [];
      const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
      setCartCount(count);
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  const handleCategorySelect = (e) => {
    const val = e.target.value;
    if (val) {
      if (val === 'custome_frame') {
        navigate('/custom');
      } else {
        navigate(`/${val}`);
      }
      e.target.value = '';
      setIsMenuOpen(false);
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim() !== '') {
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery('');
      }
    }
  };

  return (
    <header>
      <Link to="/" style={{ backgroundColor: 'transparent' }}>
        <img src="/assets/images/logo.png" alt="Vitthal Photos Logo" />
      </Link>
      
      <div className="search-box">
        <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="search" 
          id="header-search" 
          placeholder="Search photos..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>

      <nav className="nav-menu">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/contact">Contact Us</Link></li>
          {isAdmin && <li><Link to="/admin" style={{ color: '#fa873b', fontWeight: 'bold' }}>Admin</Link></li>}
          <li>
            <select id="category-select" className="dropdown" onChange={handleCategorySelect} value="">
              <option value="" disabled>Select Frame</option>
              <option value="god">God Frames</option>
              <option value="warriors">Warrior Frames</option>
              <option value="collage">Collage Frames</option>
              <option value="family">Family Frames</option>
              <option value="kids">Kids Frames</option>
              <option value="custome_frame">Custom Frames</option>
              <option value="new">New Arrivals</option>
            </select>
          </li>
        </ul>
      </nav>

      <div className="nav-icons">
        <Link to="/cart" className="icon-link" style={location.pathname === '/cart' ? { backgroundColor: '#f8ddca', position: 'relative' } : { position: 'relative' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-cart" viewBox="0 0 16 16">
            <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
          </svg>
          {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </Link>
        <Link to="/wishlist" className="icon-link" style={location.pathname === '/wishlist' ? { color: '#fa873b' } : {}}>
          {location.pathname === '/wishlist' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-heart-fill" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-heart" viewBox="0 0 16 16">
              <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15" />
            </svg>
          )}
        </Link>
        <Link to="/profile" className="icon-link" id="person" style={location.pathname === '/profile' ? { backgroundColor: '#f8ddca' } : {}}>
          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-person" viewBox="0 0 16 16">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
          </svg>
        </Link>
        <button className="menu-toggle" onClick={() => setIsMenuOpen(true)}>☰</button>
      </div>

      <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`} style={{ display: isMenuOpen ? 'block' : 'none' }}>
        <button className="close-menu" onClick={() => setIsMenuOpen(false)}>&times;</button>
        <ul>
          <li><Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link></li>
          <li><Link to="/about" onClick={() => setIsMenuOpen(false)}>About Us</Link></li>
          <li><Link to="/contact" onClick={() => setIsMenuOpen(false)}>Contact Us</Link></li>
          <li>
            <select id="category-select-mobile" className="dropdown" onChange={handleCategorySelect} value="">
              <option value="" disabled>Select Frame</option>
              <option value="god">God</option>
              <option value="warriors">Warriors</option>
              <option value="custome_frame">Custom Frame</option>
              <option value="new">New Arrivals</option>
            </select>
          </li>
          {isAdmin && <li><Link to="/admin" onClick={() => setIsMenuOpen(false)} style={{ color: '#fa873b', fontWeight: 'bold' }}>Admin Dashboard</Link></li>}
          <li>
            <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-person" viewBox="0 0 16 16" style={{ verticalAlign: 'middle', marginRight: '8px' }}>
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
              </svg> Account
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Header;
