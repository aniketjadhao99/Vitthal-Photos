import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import Reviews from '../components/Reviews';
import { normalizeImageUrl } from '../utils/imageUtils';

const API_URL = '/api'; // Setup proxy in vite.config.js

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('12 x 15 inches - Standard');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_URL}/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        setProduct(data);
        if (data.images && data.images.length > 0) {
          setSelectedImage(normalizeImageUrl(data.images[0]));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('vitthal_cart')) || [];
    
    // Calculate price based on selected size
    let sizePrice = product.price;
    if (selectedSize.includes('16 x 20')) sizePrice = product.price + 600;
    else if (selectedSize.includes('8 x 10')) sizePrice = product.price - 400;

    const existingItemIndex = cart.findIndex(i => i._id === product._id && i.size === selectedSize.split(' - ')[0]);
    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += quantity;
    } else {
      const item = {
        _id: product._id,
        name: product.name,
        price: sizePrice,
        image: product.images[0],
        size: selectedSize.split(' - ')[0],
        quantity: quantity
      };
      cart.push(item);
    }
    localStorage.setItem('vitthal_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    addToast('Added to cart successfully!');
  };

  const buyNow = () => {
    addToCart();
    navigate('/checkout');
  };

  const toggleWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem('vitthal_wishlist')) || [];
    const idx = wishlist.findIndex(item => item._id === product._id);
    if (idx === -1) {
      wishlist.push({ _id: product._id, name: product.name, price: product.price, image: product.images[0] });
      addToast('Added to wishlist', 'success');
    } else {
      wishlist.splice(idx, 1);
      addToast('Removed from wishlist', 'success');
    }
    localStorage.setItem('vitthal_wishlist', JSON.stringify(wishlist));
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading product...</div>;
  if (!product) return <div style={{ padding: '100px', textAlign: 'center' }}>Product not found.</div>;

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/">Home &gt;</Link> <Link to={`/${product.category.toLowerCase()}`}>{product.category} Frames &gt;</Link> {product.name}
      </div>

      <section className="product-details-container">
        <div className="product-gallery">
          <div className="main-image">
            <img id="main-product-img" src={selectedImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3DgY-zNs72yCHVJFYJAkK0SSbL9NOORmRV8YV8irhZD5e11LwGKbgL6G1APl9megiA8xN6EZ6BxUiSyKX7E2lNpqrpM2lryaHqmFNUBlXrpLZSxzj4wx34QcEhnhye79ySSbxfrslcVe7qAxIQCGWK9K2u1wVjoPEQO1oHCJxF_nIrA4eyVtcvgwyS_2PyBZTk-2Xb9Wwq3hyHNayHROxabcMs_rrrMgJ7tXZErV1lmEaV9KTJnN_EeiJB1dwpJbrPW3UrLsG-Bh7'} alt={product.name} />
          </div>
          <div className="thumbnail-list">
            {product.images && product.images.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                className={selectedImage === img ? 'active' : ''} 
                onClick={() => setSelectedImage(img)}
                alt={`Thumbnail ${idx}`}
              />
            ))}
          </div>
        </div>

        <div className="product-info">
          <h1 className="product-title">{product.name} Premium Teak Frame</h1>
          <div className="product-price">
            ₹{product.price?.toLocaleString()} 
            {product.price < 2000 && <><span className="old-price">₹{(product.price + 700).toLocaleString()}</span> <span className="discount">(35% OFF)</span></>}
          </div>

          <div className="product-rating">
            <span className="stars">★★★★★</span>
            <span className="reviews-count">(124 Reviews)</span>
          </div>

          <p className="product-description">
            Bring home the divine presence with this exquisitely crafted {product.name} photo frame. Made from
            high-quality teak wood with a premium finish, it adds serenity and elegance to your puja room or living space.
          </p>

          <div className="product-options">
            <label>Select Size:</label>
            <select className="size-select" style={{ width: '100%', marginBottom: '20px', padding: '10px' }} value={selectedSize} onChange={e => setSelectedSize(e.target.value)}>
              <option>8 x 10 inches - ₹{Math.max(product.price - 400, 500).toLocaleString()}</option>
              <option>12 x 15 inches - ₹{product.price.toLocaleString()}</option>
              <option>16 x 20 inches - ₹{(product.price + 600).toLocaleString()}</option>
            </select>
          </div>
          
          <div className="product-options" style={{ marginBottom: '20px' }}>
            <label>Quantity:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>-</button>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>+</button>
            </div>
          </div>

          <div className="action-buttons">
            <button className="add-cart-btn" onClick={addToCart}><i className="bi bi-cart"></i> Add to Cart</button>
            <button className="buy-now-btn" onClick={buyNow}>Buy Now</button>
            <button 
              className="wishlist-btn" 
              onClick={toggleWishlist} 
              style={{ padding: '15px', borderRadius: '12px', border: '2px solid #eee', background: 'white', color: '#666', cursor: 'pointer', transition: 'all 0.3s' }}
            >
              <i className="bi bi-heart" style={{ fontSize: '1.2rem' }}></i>
            </button>
          </div>

          <div className="product-features">
            <div className="p-feature">
              <span className="material-symbols-outlined">verified</span>
              <span>100% Authentic</span>
            </div>
            <div className="p-feature">
              <span className="material-symbols-outlined">local_shipping</span>
              <span>Free Shipping</span>
            </div>
            <div className="p-feature">
              <span className="material-symbols-outlined">assignment_return</span>
              <span>7 Days Return</span>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="reviews-section" style={{ padding: '100px 0', background: '#fafafa', borderTop: '1px solid #eee' }}>
        <Reviews productId={id} />
      </section>
    </>
  );
};

export default ProductDetails;
