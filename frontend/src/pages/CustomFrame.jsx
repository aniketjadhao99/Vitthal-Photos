import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import Reviews from '../components/Reviews';

const CustomFrame = () => {
  const [photo, setPhoto] = useState(null);
  const [frameStyle, setFrameStyle] = useState('ornate');
  const [orientation, setOrientation] = useState('vertical');
  const [sizeAndPrice, setSizeAndPrice] = useState({ size: '8x10', price: 500 });
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setPhoto(loadEvent.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSizeChange = (e) => {
    const option = e.target.options[e.target.selectedIndex];
    setSizeAndPrice({
      size: option.value,
      price: parseInt(option.getAttribute('data-price'))
    });
  };

  const getBorderFromStyle = () => {
    if (frameStyle === 'ornate') return '20px solid transparent';
    if (frameStyle === 'vintage') return '15px solid #8a6327';
    if (frameStyle === 'modern') return '10px solid #222';
    return '10px solid #000';
  };

  const getBorderImage = () => {
    if (frameStyle === 'ornate') return 'url("https://img.freepik.com/free-vector/baroque-stucco-gold-frame-vector-floral-design_53876-170725.jpg") 30 stretch';
    if (frameStyle === 'vintage') return 'url("https://img.freepik.com/free-vector/realistic-gold-frame_1017-6401.jpg") 20 stretch';
    return 'none';
  };

  const addToCart = () => {
    if (!photo) {
      addToast("Please upload a photo first!", "error");
      return;
    }
    const cart = JSON.parse(localStorage.getItem('vitthal_cart')) || [];
    // Check if an identical custom frame (same style, size, orientation, and photo) already exists
    const existingItemIndex = cart.findIndex(i => 
      i.isCustom && 
      i.name === `Custom ${frameStyle.charAt(0).toUpperCase() + frameStyle.slice(1)} Frame` && 
      i.size === sizeAndPrice.size && 
      i.orientation === orientation &&
      i.image === photo // Compare base64/url
    );

    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += 1;
    } else {
      const item = {
        _id: 'custom-' + Date.now(),
        name: `Custom ${frameStyle.charAt(0).toUpperCase() + frameStyle.slice(1)} Frame`,
        price: sizeAndPrice.price,
        image: photo,
        size: sizeAndPrice.size,
        quantity: 1,
        isCustom: true,
        orientation
      };
      cart.push(item);
    }
    localStorage.setItem('vitthal_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    addToast('Custom frame added to cart!');
  };

  const buyNow = () => {
    if (!photo) {
      addToast("Please upload a photo first!", "error");
      return;
    }
    addToCart();
    navigate('/checkout');
  };

  return (
    <>
      <section className="custom-frame-section">
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div className="breadcrumbs" style={{ padding: '20px 0', marginBottom: '20px' }}>
            <Link to="/">Home</Link> &nbsp; &gt; &nbsp; 
            <span>Create Your Own</span>
          </div>
          
          <div className="custom-frame-container">
            {/* Preview Section */}
            <div className="preview-section">
              <div className="preview-card" style={{ position: 'sticky', top: '100px' }}>
                <div className="price-badge">
                  <i className="bi bi-tag-fill"></i>
                  <span>₹{sizeAndPrice.price}</span>
                </div>
                
                <div className="frame-visualizer" id="frame-preview" style={{ 
                  width: orientation === 'vertical' ? '250px' : '350px', 
                  height: orientation === 'vertical' ? '350px' : '250px',
                  border: getBorderFromStyle(),
                  borderImage: getBorderImage(),
                  backgroundColor: '#fff',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  margin: '0 auto',
                  transition: 'all 0.3s ease'
                }}>
                  {!photo ? (
                    <div className="empty-preview-msg">
                      <i className="bi bi-image" style={{ fontSize: '3rem', color: '#ddd' }}></i>
                      <p>Upload your photo to see the preview</p>
                    </div>
                  ) : (
                    <img src={photo} alt="Your Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
              </div>
            </div>

            {/* Options Section */}
            <div className="options-panel">
              <div className="option-card">
                <h3><i className="bi bi-cloud-upload"></i> Step 1: Upload Photo</h3>
                <div className="file-upload-wrapper">
                  <div className="custom-file-input">
                    <i className="bi bi-camera"></i>
                    <span>Click to choose or drag & drop</span>
                    <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>Supports: JPG, PNG, WEBP (Max 5MB)</p>
                  </div>
                  <input type="file" id="photo-upload" accept="image/*" onChange={handlePhotoUpload} />
                </div>
              </div>

              <div className="option-card">
                <h3><i className="bi bi-palette"></i> Step 2: Choose Frame Style</h3>
                <div className="frame-grid">
                  <div className={`frame-thumb ${frameStyle === 'ornate' ? 'selected' : ''}`} onClick={() => setFrameStyle('ornate')} style={{ backgroundImage: "url('https://img.freepik.com/free-vector/baroque-stucco-gold-frame-vector-floral-design_53876-170725.jpg')" }}>
                    <span>Ornate</span>
                  </div>
                  <div className={`frame-thumb ${frameStyle === 'vintage' ? 'selected' : ''}`} onClick={() => setFrameStyle('vintage')} style={{ backgroundImage: "url('https://img.freepik.com/free-vector/realistic-gold-frame_1017-6401.jpg')" }}>
                    <span>Vintage</span>
                  </div>
                  <div className={`frame-thumb ${frameStyle === 'modern' ? 'selected' : ''}`} onClick={() => setFrameStyle('modern')} style={{ backgroundImage: "url('https://img.freepik.com/free-vector/empty-golden-frame-vector_53876-172151.jpg')" }}>
                    <span>Modern</span>
                  </div>
                </div>
              </div>

              <div className="option-card">
                <h3><i className="bi bi-aspect-ratio"></i> Step 3: Orientation</h3>
                <div className="toggle-group">
                  <button className={`toggle-btn ${orientation === 'vertical' ? 'active' : ''}`} onClick={() => setOrientation('vertical')}>
                    <i className="bi bi-pc-display"></i> Portrait
                  </button>
                  <button className={`toggle-btn ${orientation === 'horizontal' ? 'active' : ''}`} onClick={() => setOrientation('horizontal')}>
                    <i className="bi bi-pc-display-horizontal"></i> Landscape
                  </button>
                </div>
              </div>

              <div className="option-card">
                <h3><i className="bi bi-rulers"></i> Step 4: Select Size</h3>
                <select className="modern-select" onChange={handleSizeChange} defaultValue="8x10">
                  <option value="5x7" data-price="400">5 x 7 inches (₹400)</option>
                  <option value="8x10" data-price="500">8 x 10 inches (₹500)</option>
                  <option value="9x11.5" data-price="600">9 x 11.5 inches (₹600)</option>
                  <option value="10x12" data-price="700">10 x 12 inches (₹700)</option>
                  <option value="12x16" data-price="900">12 x 16 inches (₹900)</option>
                  <option value="16x20" data-price="1200">16 x 20 inches (₹1200)</option>
                  <option value="12x18" data-price="1000">12 x 18 inches (₹1000)</option>
                  <option value="15x19.5" data-price="1300">15 x 19.5 inches (₹1300)</option>
                  <option value="18x24" data-price="1500">18 x 24 inches (₹1500)</option>
                  <option value="20x28" data-price="1800">20 x 28 inches (₹1800)</option>
                  <option value="24x36" data-price="2200">24 x 36 inches (₹2200)</option>
                </select>
              </div>

              <div className="actions-group">
                <button className="btn-premium btn-outline" onClick={addToCart}>
                  <i className="bi bi-cart-plus"></i> Add to Cart
                </button>
                <button className="btn-premium btn-primary" onClick={buyNow}>
                  <i className="bi bi-bag-check"></i> Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="reviews-section" style={{ padding: '100px 0', background: '#fafafa', borderTop: '1px solid #eee' }}>
        <Reviews pageName="custom" />
      </section>
    </>
  );
};

export default CustomFrame;
