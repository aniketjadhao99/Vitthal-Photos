import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { normalizeImageUrl } from '../utils/imageUtils';

const API_URL = '/api'; // Use proxy or env var in real app

const Home = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const scrollRef = useRef(null);
  const [collectionImages, setCollectionImages] = useState({ god: null, warriors: null, custom: null });
  const [trendingProducts, setTrendingProducts] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      try {
        const res = await fetch(`${API_URL}/products/trending`, { signal: controller.signal });
        if (!res.ok) return;
        const products = await res.json();

        const usedImages = new Set();
        const getProxyUrl = (url) => {
          if (!url) return null;
          return normalizeImageUrl(url);
        };

        const findUniqueImage = (categories) => {
          const cats = Array.isArray(categories) ? categories : [categories];
          for (const product of products) {
            if (cats.includes(product.category) && product.images && product.images.length > 0) {
              const rawUrl = product.images[0];
              if (!usedImages.has(rawUrl)) {
                const proxyUrl = getProxyUrl(rawUrl);
                if (proxyUrl) {
                  usedImages.add(rawUrl);
                  return proxyUrl;
                }
              }
            }
          }
          return null;
        };

        const godImg = findUniqueImage('God');
        const warriorImg = findUniqueImage('Warriors');
        const customImg = findUniqueImage(['New', 'Custom']) || findUniqueImage('Warriors') || findUniqueImage('God');

        setCollectionImages({
          god: godImg || '/assets/images/logo.png',
          warriors: warriorImg || '/assets/images/logo.png',
          custom: customImg || '/assets/images/logo.png'
        });

        if (products.length > 0) {
          setTrendingProducts(products.slice(0, 6));
        }

      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error loading data:', err);
        }
      }
    };

    loadData();
    return () => controller.abort();
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
        size: '12x15 in', // Default size
        quantity: 1
      };
      cart.push(item);
    }
    
    localStorage.setItem('vitthal_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    addToast('Added to cart successfully!');
  };

  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  
  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subscribeEmail) return;
    
    setSubscribeLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscribeEmail })
      });

      if (res.ok) {
        addToast('Thank you for subscribing!', 'success');
        setSubscribeEmail('');
      } else {
        const err = await res.json();
        addToast(err.message || 'Failed to subscribe', 'error');
      }
    } catch (error) {
      addToast('Error subscribing to newsletter', 'error');
    } finally {
      setSubscribeLoading(false);
    }
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
    // Optional dispatch for wishlist updates if tracked in header
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <>
      <section className="hero">
        <div className="hero-conteiner">
          <img
            className="hero-banner"
            src="/assets/images/unnamed.png"
            alt="Vitthal Photo Frames premium collection"
            loading="eager"
            fetchPriority="high"
            width="1600"
            height="900"
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <span className="label">New Collection</span>
            <h1>Frame Your <br /><span className="text-primary">Devotion & Pride</span></h1>
            <p>Premium photo frames celebrating Indian heritage—from divine deities to fearless warriors.</p>
            <div className="Buttons">
              <button className="btn1" onClick={() => navigate('/god')}>Shop Collection</button>
              <button className="btn2" onClick={() => navigate('/custom')}>Explore Custom</button>
            </div>
          </div>
        </div>
      </section>

      <section className="features-board">
        <div className="Board">
          <div className="feature">
            <div className="Symbols">
              <span className="material-symbols-outlined text-2xl">workspace_premium</span>
            </div>
            <div className="feature-text">
              <h3>Premium Teak Wood</h3>
              <p>Handcrafted durability</p>
            </div>
          </div>
          <div className="feature">
            <div className="Symbols">
              <span className="material-symbols-outlined text-2xl">print</span>
            </div>
            <div className="feature-text">
              <h3>High-Res Printing</h3>
              <p>Museum quality finishes</p>
            </div>
          </div>
          <div className="feature">
            <div className="Symbols">
              <span className="material-symbols-outlined text-2xl">flag</span>
            </div>
            <div className="feature-text">
              <h3>Made in India</h3>
              <p>Celebrating local artisans</p>
            </div>
          </div>
        </div>
      </section>

      <section className="Collections">
        <div className="Collections-top">
          <h2 className="section-title">Explore Our Collections</h2>
          <Link to="/god" className="view-all">View All 
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right" viewBox="0 0 16 16" style={{marginLeft: '5px'}}>
              <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
            </svg>
          </Link>
        </div>

        <div className="collection-grid" id="collection-grid">
          <div className="collection" onClick={() => navigate('/god')} style={{ cursor: 'pointer' }}>
            <div className="collection-item">
              <img width="640" height="420" src={collectionImages.god || "/assets/images/logo.png"} alt="God Frames" loading="lazy" decoding="async" />
              <div className="collection-label" style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(255,255,255,0.95)', padding: '10px 22px', borderRadius: '10px', fontWeight: 700, color: '#333', fontSize: '1rem', zIndex: 5, boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>God Frames</div>
            </div>
          </div>
          <div className="collection" onClick={() => navigate('/warriors')} style={{ cursor: 'pointer' }}>
            <div className="collection-item">
              <img width="640" height="420" src={collectionImages.warriors || "/assets/images/logo.png"} alt="Warrior Frames" loading="lazy" decoding="async" />
              <div className="collection-label" style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(255,255,255,0.95)', padding: '10px 22px', borderRadius: '10px', fontWeight: 700, color: '#333', fontSize: '1rem', zIndex: 5, boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>Warrior Frames</div>
            </div>
          </div>
          <div className="collection" onClick={() => navigate('/custom')} style={{ cursor: 'pointer' }}>
            <div className="collection-item">
              <img width="640" height="420" src={collectionImages.custom || "/assets/images/logo.png"} alt="Custom Frames" loading="lazy" decoding="async" />
              <div className="collection-label" style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(255,255,255,0.95)', padding: '10px 22px', borderRadius: '10px', fontWeight: 700, color: '#333', fontSize: '1rem', zIndex: 5, boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>Custom Frames</div>
            </div>
          </div>
        </div>
      </section>

      <section className="Trending">
        <div className="Trending-box">
          <div className="Top-Trending">
            <div className="section-title">
              <h3>Trending Now</h3>
              <p>Best-selling frames this week</p>
            </div>
            <div className="Arows">
              <button className="back-arow" onClick={() => scroll('left')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M15 8a.5.5 0 0 1-.5.5H2.707l3.147 3.146a.5.5 0 0 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 7.5H14.5A.5.5 0 0 1 15 8z" />
                </svg>
              </button>
              <button className="forward-arow" onClick={() => scroll('right')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="Trending-products" id="trending-products-container" ref={scrollRef} style={{ display: 'flex', overflowX: 'auto', scrollBehavior: 'smooth' }}>
            {trendingProducts.length > 0 ? trendingProducts.map(product => (
                <div className="T-product" key={product._id}>
                  <div className="img-cover" onClick={() => navigate(`/product/${product._id}`)}>
                    <img
                      className="img-1"
                      width="360"
                      height="360"
                      src={normalizeImageUrl(product.images?.[0]) || '/assets/images/logo.png'}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                    />
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
                      <span id="span-name" className="text-[#8a7560] text-sm">{product.category} Collection</span>
                      <span className="text-lg font-semibold">₹{product.price}</span>
                    </div>
                  </div>
                </div>
            )) : (
              // Fallback content if API fails
              [1,2,3,4].map(i => (
                <div className="T-product" key={i}>
                  <div className="img-cover">
                    <img className="img-1" width="360" height="360" src="/assets/images/logo.png" alt="Featured frame" loading="lazy" decoding="async" />
                    <button className="fev-btn">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-heart" viewBox="0 0 16 16">
                        <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15" />
                      </svg>
                    </button>
                    <div className="cart-btn">
                      <button className="Add-to-cart"><i className="bi bi-cart"></i> Add to Cart</button>
                    </div>
                  </div>
                  <div className="Trending-product-details">
                    <h4>Lord Ganesha Frame</h4>
                    <div className="T-product-span">
                      <span id="span-name" className="text-[#8a7560] text-sm">Divine Collection</span>
                      <span className="text-lg font-semibold">₹1,299</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="CTA-section">
        <div className="CTA-Box">
          <div className="CTA-span">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-envelope" viewBox="0 0 16 16">
              <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z" />
            </svg>
          </div>
          <h2>Join the Heritage Community</h2>
          <p>Subscribe for exclusive offers on new divine arrivals and limited edition warrior frames.</p>
          <form className="CTA-input" onSubmit={handleSubscribe}>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              value={subscribeEmail}
              onChange={(e) => setSubscribeEmail(e.target.value)}
              required
              disabled={subscribeLoading}
            />
            <button type="submit" className="subscribe-btn" disabled={subscribeLoading} style={{ opacity: subscribeLoading ? 0.7 : 1 }}>
              {subscribeLoading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>
    </>
  );
};

export default Home;
