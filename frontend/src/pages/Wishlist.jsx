import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem('vitthal_wishlist')) || [];
    setWishlistItems(wishlist);
  }, []);

  const removeItem = (index) => {
    const updatedWishlist = [...wishlistItems];
    updatedWishlist.splice(index, 1);
    setWishlistItems(updatedWishlist);
    localStorage.setItem('vitthal_wishlist', JSON.stringify(updatedWishlist));
  };

  const addToCart = (product, index) => {
    const cart = JSON.parse(localStorage.getItem('vitthal_cart')) || [];
    const existingItemIndex = cart.findIndex(i => i._id === product._id && i.size === '12x15 in');

    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1, size: '12x15 in' });
    }
    
    localStorage.setItem('vitthal_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    
    removeItem(index);
    addToast('Added to cart successfully!');
  };

  return (
    <>
      <div className="breadcrumbs" style={{ padding: '20px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <Link to="/">Home &gt;</Link> My Wishlist
      </div>

      <div className="wishlist-container" style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <div className="wishlist-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '10px', fontWeight: 800 }}>My Wishlist</h1>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>Your curated collection of heritage frames</p>
        </div>

        {wishlistItems.length > 0 ? (
          <div className="wishlist-product-grid">
            {wishlistItems.map((item, index) => (
              <div className="T-product" key={index} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="img-cover" onClick={() => navigate(`/product/${item._id}`)}>
                  <div className="img-1" style={{ backgroundImage: `url('${item.image}')` }}></div>
                  <button className="fev-btn liked" onClick={(e) => { e.stopPropagation(); removeItem(index); }} style={{ display: 'flex', opacity: 1, background: '#f5e3d8' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-heart-fill" viewBox="0 0 16 16" style={{ color: '#fa873b' }}>
                      <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z" />
                    </svg>
                  </button>
                </div>
                <div className="Trending-product-details">
                  <h4>{item.name}</h4>
                  <div className="T-product-span">
                    <span className="text-lg font-semibold">₹{item.price?.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => addToCart(item, index)} className="btn-add-to-cart" style={{ flex: 1, padding: '12px', background: '#fa873b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-wishlist" style={{ textAlign: 'center', padding: '100px 20px', background: 'white', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <i className="bi bi-heart" style={{ fontSize: '100px', color: '#f5f5f5', marginBottom: '30px', display: 'block' }}></i>
            <h2 style={{ fontSize: '2rem', color: '#333', marginBottom: '15px', fontWeight: 800 }}>Your Wishlist is Empty</h2>
            <p style={{ color: '#777', marginBottom: '30px', fontSize: '1.1rem' }}>Explore our collections and save your favorite frames.</p>
            <Link to="/god" style={{ display: 'inline-block', background: '#fa873b', color: 'white', padding: '15px 40px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, boxShadow: '0 10px 20px rgba(250, 135, 59, 0.2)' }}>
              Explore Collections
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Wishlist;
