import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import Reviews from '../components/Reviews';
import '../styles/CustomFrame.css';

const CustomFrame = () => {
  const [photo, setPhoto] = useState(null);
  const [frameStyle, setFrameStyle] = useState('modern');
  const [orientation, setOrientation] = useState('vertical');
  const [sizeAndPrice, setSizeAndPrice] = useState({ size: '8x10', price: 500 });
  const [photoName, setPhotoName] = useState('');
  const navigate = useNavigate();
  const { addToast } = useToast();

  const frames = [
    {
      id: 'modern',
      name: 'Modern',
      image: 'https://img.freepik.com/free-vector/empty-golden-frame-vector_53876-172151.jpg',
      description: 'Clean & Minimalist',
      borderStyle: '10px solid #222'
    },
    {
      id: 'ornate',
      name: 'Ornate',
      image: 'https://img.freepik.com/free-vector/baroque-stucco-gold-frame-vector-floral-design_53876-170725.jpg',
      description: 'Elegant & Decorative',
      borderStyle: '20px solid transparent'
    },
    {
      id: 'vintage',
      name: 'Vintage',
      image: 'https://img.freepik.com/free-vector/realistic-gold-frame_1017-6401.jpg',
      description: 'Classic & Timeless',
      borderStyle: '15px solid #8a6327'
    }
  ];

  const sizes = [
    { value: '5x7', label: '5 x 7 inches', price: 400 },
    { value: '8x10', label: '8 x 10 inches', price: 500 },
    { value: '9x11.5', label: '9 x 11.5 inches', price: 600 },
    { value: '10x12', label: '10 x 12 inches', price: 700 },
    { value: '12x16', label: '12 x 16 inches', price: 900 },
    { value: '12x18', label: '12 x 18 inches', price: 1000 },
    { value: '16x20', label: '16 x 20 inches', price: 1200 },
    { value: '15x19.5', label: '15 x 19.5 inches', price: 1300 },
    { value: '18x24', label: '18 x 24 inches', price: 1500 },
    { value: '20x28', label: '20 x 28 inches', price: 1800 },
    { value: '24x36', label: '24 x 36 inches', price: 2200 }
  ];

  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        addToast('File size must be less than 5MB', 'error');
        return;
      }
      setPhotoName(file.name);
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setPhoto(loadEvent.target.result);
        addToast('Photo uploaded successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSizeChange = (value) => {
    const selected = sizes.find(s => s.value === value);
    setSizeAndPrice({ size: value, price: selected.price });
  };

  const getFrameStyle = () => {
    const frame = frames.find(f => f.id === frameStyle);
    if (frameStyle === 'ornate') return '20px solid transparent';
    if (frameStyle === 'vintage') return '15px solid #8a6327';
    return '10px solid #222';
  };

  const getFrameImage = () => {
    if (frameStyle === 'ornate') return 'url("https://img.freepik.com/free-vector/baroque-stucco-gold-frame-vector-floral-design_53876-170725.jpg") 30 stretch';
    if (frameStyle === 'vintage') return 'url("https://img.freepik.com/free-vector/realistic-gold-frame_1017-6401.jpg") 20 stretch';
    return 'none';
  };

  const addToCart = () => {
    if (!photo) {
      addToast('Please upload a photo first!', 'error');
      return;
    }
    const cart = JSON.parse(localStorage.getItem('vitthal_cart')) || [];
    const existingItemIndex = cart.findIndex(i => 
      i.isCustom && 
      i.name === `Custom ${frameStyle.charAt(0).toUpperCase() + frameStyle.slice(1)} Frame` && 
      i.size === sizeAndPrice.size && 
      i.orientation === orientation &&
      i.image === photo
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
    addToast('✓ Custom frame added to cart!', 'success');
  };

  const buyNow = () => {
    if (!photo) {
      addToast('Please upload a photo first!', 'error');
      return;
    }
    addToCart();
    navigate('/checkout');
  };

  return (
    <>
      <section className="custom-frame-section">
        <div className="container">
          <div className="breadcrumbs">
            <Link to="/">Home</Link>
            <span className="separator">›</span>
            <span>Create Your Own Frame</span>
          </div>

          <div className="custom-frame-header">
            <h1>Design Your Perfect Frame</h1>
            <p>Personalize your memories with our easy-to-use customization tool</p>
          </div>

          <div className="progress-indicator">
            <div className={`progress-step ${photo ? 'completed' : 'active'}`}>
              <div className="step-number">1</div>
              <div className="step-label">Upload Photo</div>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${frameStyle ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Select Frame</div>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${sizeAndPrice.size ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Choose Size</div>
            </div>
            <div className="progress-line"></div>
            <div className="progress-step active">
              <div className="step-number">4</div>
              <div className="step-label">Checkout</div>
            </div>
          </div>

          <div className="custom-frame-main">
            {/* Preview Section */}
            <div className="preview-container">
              <div className="preview-card">
                <div className="preview-header">
                  <h3>Live Preview</h3>
                  <span className="size-info">{sizeAndPrice.size} inches</span>
                </div>

                <div className="frame-visualizer" style={{ 
                  width: orientation === 'vertical' ? '280px' : '380px', 
                  height: orientation === 'vertical' ? '380px' : '280px',
                  border: getFrameStyle(),
                  borderImage: getFrameImage(),
                }}>
                  {!photo ? (
                    <div className="empty-preview">
                      <i className="bi bi-image"></i>
                      <p>Upload photo to see preview</p>
                    </div>
                  ) : (
                    <img src={photo} alt="Preview" />
                  )}
                </div>

                <div className="price-display">
                  <span className="price-label">Total Price</span>
                  <span className="price-amount">₹{sizeAndPrice.price}</span>
                </div>
              </div>
            </div>

            {/* Customization Panel */}
            <div className="customization-panel">
              {/* Step 1: Upload Photo */}
              <div className="custom-step">
                <div className="step-header">
                  <i className="bi bi-cloud-upload"></i>
                  <h3>Step 1: Upload Your Photo</h3>
                  {photo && <span className="badge-success">✓ Done</span>}
                </div>
                <div className="step-content">
                  <div className="file-upload-box">
                    <div className="file-upload-inner">
                      <i className="bi bi-camera-fill"></i>
                      <p className="upload-main">Click or drag & drop</p>
                      <p className="upload-sub">JPG, PNG, WEBP (Max 5MB)</p>
                    </div>
                    <input 
                      type="file" 
                      id="photo-upload" 
                      accept="image/*" 
                      onChange={handlePhotoUpload}
                      className="file-input"
                    />
                  </div>
                  {photoName && (
                    <div className="uploaded-info">
                      <i className="bi bi-check-circle-fill"></i>
                      <span>{photoName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Frame Selection */}
              <div className="custom-step">
                <div className="step-header">
                  <i className="bi bi-palette-fill"></i>
                  <h3>Step 2: Choose Frame Style</h3>
                </div>
                <div className="step-content">
                  <div className="frames-grid">
                    {frames.map(frame => (
                      <div 
                        key={frame.id}
                        className={`frame-option ${frameStyle === frame.id ? 'selected' : ''}`}
                        onClick={() => setFrameStyle(frame.id)}
                      >
                        <div className="frame-preview-thumb" style={{ backgroundImage: `url(${frame.image})` }}>
                          {frameStyle === frame.id && (
                            <div className="selection-badge">
                              <i className="bi bi-check2"></i>
                            </div>
                          )}
                        </div>
                        <div className="frame-info">
                          <p className="frame-name">{frame.name}</p>
                          <p className="frame-desc">{frame.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3: Orientation & Size */}
              <div className="custom-step">
                <div className="step-header">
                  <i className="bi bi-aspect-ratio-fill"></i>
                  <h3>Step 3: Orientation & Size</h3>
                </div>
                <div className="step-content">
                  <div className="orientation-selector">
                    <label>Orientation</label>
                    <div className="toggle-group">
                      <button 
                        className={`toggle-btn ${orientation === 'vertical' ? 'active' : ''}`}
                        onClick={() => setOrientation('vertical')}
                      >
                        <i className="bi bi-portrait"></i> Portrait
                      </button>
                      <button 
                        className={`toggle-btn ${orientation === 'horizontal' ? 'active' : ''}`}
                        onClick={() => setOrientation('horizontal')}
                      >
                        <i className="bi bi-landscape"></i> Landscape
                      </button>
                    </div>
                  </div>

                  <div className="size-selector">
                    <label htmlFor="size-select">Size</label>
                    <div className="size-grid">
                      {sizes.map(size => (
                        <button
                          key={size.value}
                          className={`size-option ${sizeAndPrice.size === size.value ? 'selected' : ''}`}
                          onClick={() => handleSizeChange(size.value)}
                        >
                          <span className="size-label">{size.label}</span>
                          <span className="size-price">₹{size.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button className="btn btn-secondary" onClick={addToCart}>
                  <i className="bi bi-cart-plus"></i>
                  Add to Cart
                </button>
                <button className="btn btn-primary" onClick={buyNow}>
                  <i className="bi bi-bag-check-fill"></i>
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="reviews-section">
        <Reviews pageName="custom" />
      </section>
    </>
  );
};

export default CustomFrame;
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
