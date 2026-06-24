import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import CollectionsNav from '../components/CollectionsNav';

const API_URL = '/api';

const FamilyFrames = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) return;
        const allProducts = await res.json();
        // Filter by Family category
        setProducts(allProducts.filter(p => p.category === 'Family' || p.category === 'Families'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();

    // Listen for product updates from admin panel
    window.addEventListener('productsUpdated', fetchProducts);
    return () => window.removeEventListener('productsUpdated', fetchProducts);
  }, []);

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('vitthal_cart')) || [];
    const existingItemIndex = cart.findIndex(i => i._id === product._id && i.size === '12x15 in');
    
    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += 1;
    } else {
      const item = {
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        size: '12x15 in',
        quantity: 1
      };
      cart.push(item);
    }
    
    localStorage.setItem('vitthal_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    addToast('Added to cart successfully!');
  };

  const toggleWishlist = (product) => {
    const wishlist = JSON.parse(localStorage.getItem('vitthal_wishlist')) || [];
    const idx = wishlist.findIndex(item => item._id === product._id);
    if (idx === -1) {
      wishlist.push({ _id: product._id, name: product.name, price: product.price, image: product.images[0] });
      addToast('Added to wishlist');
    } else {
      wishlist.splice(idx, 1);
      addToast('Removed from wishlist');
    }
    localStorage.setItem('vitthal_wishlist', JSON.stringify(wishlist));
  };

  return (
    <>
      <div className="breadcrumbs" style={{ padding: '20px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <Link to="/">Home &gt;</Link> Family Frames
      </div>

      <div className="category-header" style={{ textAlign: 'center', padding: '40px 20px', background: 'linear-gradient(135deg, #f4ebd9 0%, #fbf8f3 100%)', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#0b1325', marginBottom: '10px', fontWeight: 800 }}>Family Collection</h1>
        <p style={{ color: '#141d30', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Celebrate your family bonds with elegant frames that capture cherished moments and unite your loved ones.</p>
      </div>

      <CollectionsNav />

      <div className="collection-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', marginBottom: '80px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>Loading Collection...</div>
        ) : products.length > 0 ? (
          <div className="category-product-grid">
            {products.map(product => (
              <div className="T-product" key={product._id}>
                <div className="img-cover" onClick={() => navigate(`/product/${product._id}`)}>
                  <div className="img-1" style={{ backgroundImage: `url('${product.images[0] || '/assets/images/logo.png'}')` }}></div>
                  <button className="fev-btn" onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-heart" viewBox="0 0 16 16">
                      <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15" />
                    </svg>
                  </button>
                  <div className="cart-btn">
                    <button className="Add-to-cart" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>
                      <i className="bi bi-cart"></i> Add to Cart
                    </button>
                  </div>
                </div>
                <div className="Trending-product-details">
                  <h4>{product.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</p>
                  <div className="T-product-span">
                    <span className="text-[#8a7560] text-sm">Family Collection</span>
                    <span className="text-lg font-semibold">₹{product.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px' }}>No products found in this collection.</div>
        )}
      </div>
    </>
  );
};

export default FamilyFrames;
