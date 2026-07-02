import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import Reviews from '../components/Reviews';
import CollectionsNav from '../components/CollectionsNav';
import '../styles/CustomFrame.css';
import Cropper from 'react-easy-crop';

// Helpers for cropping
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (err) => reject(err));
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    (safeArea - image.width) / 2,
    (safeArea - image.height) / 2
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - (safeArea - image.width) / 2 - pixelCrop.x),
    Math.round(0 - (safeArea - image.height) / 2 - pixelCrop.y)
  );

  return new Promise((resolve) => {
    canvas.toDataURL('image/jpeg', 0.9, (dataUrl) => resolve(dataUrl));
    const result = canvas.toDataURL('image/jpeg', 0.9);
    resolve(result);
  });
};

const CustomFrame = () => {
  // Photo & Crop State
  const [photo, setPhoto] = useState(null);
  const [photoName, setPhotoName] = useState('');
  const [cropMode, setCropMode] = useState(false);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropRotation, setCropRotation] = useState(0);
  
  // Frame & Design State
  const [frameStyle, setFrameStyle] = useState('modern');
  const [orientation, setOrientation] = useState('vertical');
  const [frameColor, setFrameColor] = useState('black');
  const [material, setMaterial] = useState('wood');
  const [glassFinish, setGlassFinish] = useState('regular');
  const [mattingStyle, setMattingStyle] = useState('none');
  const [mattingWidth, setMattingWidth] = useState(1);
  const [mattingColor, setMattingColor] = useState('white');
  
  // Size & Price State
  const [sizeAndPrice, setSizeAndPrice] = useState({ size: '8x10', price: 500 });
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(500);
  
  // Text & Personalization State
  const [addText, setAddText] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [textPosition, setTextPosition] = useState('bottom');
  const [textSize, setTextSize] = useState('medium');
  
  // UI State
  const [showComparison, setShowComparison] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [designName, setDesignName] = useState('');
  // removed 3D view and comparison features per admin request
  const [view3D, setView3D] = useState(false);
  
  const navigate = useNavigate();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  // State for dynamic frame styles
  const [frames, setFrames] = useState([
    { id: 'modern', name: 'Modern', image: 'https://img.freepik.com/free-vector/empty-golden-frame-vector_53876-172151.jpg', description: 'Clean & Minimalist', borderColor: '#d4af37', borderWidth: 8 },
    { id: 'ornate', name: 'Ornate', image: 'https://img.freepik.com/free-vector/baroque-stucco-gold-frame-vector-floral-design_53876-170725.jpg', description: 'Elegant & Decorative', borderColor: '#b8860b', borderWidth: 12 },
    { id: 'vintage', name: 'Vintage', image: 'https://img.freepik.com/free-vector/realistic-gold-frame_1017-6401.jpg', description: 'Classic & Timeless', borderColor: '#8b7355', borderWidth: 10 }
  ]);

  // Data
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

  const materials = [
    { id: 'wood', name: 'Wood', price: 0, icon: 'bi-tree-fill' },
    { id: 'metal', name: 'Aluminum', price: 200, icon: 'bi-hammer' },
    { id: 'plastic', name: 'Plastic', price: -100, icon: 'bi-boxes' }
  ];



  // Load saved designs on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('vitthal_saved_designs')) || [];
    setSavedDesigns(saved);
  }, []);

  // Load frame styles from localStorage (updated by AdminPanel)
  useEffect(() => {
    const savedFrameStyles = JSON.parse(localStorage.getItem('vitthal_frameStyles'));
    if (savedFrameStyles && Array.isArray(savedFrameStyles) && savedFrameStyles.length > 0) {
      setFrames(savedFrameStyles);
    }
  }, []);

  // Calculate price with all add-ons and bulk discount
  useEffect(() => {
    let basePrice = sizeAndPrice.price;
    let addOnPrice = 0;
    
    // Material price
    const materialInfo = materials.find(m => m.id === material);
    if (materialInfo) addOnPrice += materialInfo.price;
    
    // Text price
    let textPrice = 0;
    if (addText && textContent) {
      textPrice = 50;
    }
    
    let unitPrice = basePrice + addOnPrice + textPrice;
    
    // Bulk discount
    let discountPercent = 0;
    if (quantity >= 5) discountPercent = 5;
    if (quantity >= 10) discountPercent = 10;
    if (quantity >= 20) discountPercent = 15;
    
    const discountAmount = (unitPrice * discountPercent) / 100;
    const finalUnitPrice = unitPrice - discountAmount;
    
    setTotalPrice(Math.round(finalUnitPrice * quantity));
  }, [sizeAndPrice.price, material, glassFinish, mattingStyle, mattingWidth, addText, textContent, quantity]);

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
        setCropMode(true);
        addToast('Photo uploaded! Now crop it', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropConfirm = () => {
    if (!photo) return;
    // Use cropper result to create cropped image
    (async () => {
      try {
        const croppedDataUrl = await getCroppedImg(photo, croppedAreaPixels, cropRotation);
        setPhoto(croppedDataUrl);
        setCropMode(false);
        addToast('Photo cropped successfully!', 'success');
      } catch (err) {
        console.error(err);
        addToast('Failed to crop image', 'error');
      }
    })();
  };

  // Cropper state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = (croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleSizeChange = (value) => {
    const selected = sizes.find(s => s.value === value);
    setSizeAndPrice({ size: value, price: selected.price });
  };

  const saveDesign = () => {
    if (!photo || !designName.trim()) {
      addToast('Please enter a design name', 'error');
      return;
    }
    
    const newDesign = {
      id: Date.now(),
      name: designName,
      photo,
      frameStyle,
      material,
      glassFinish,
      mattingStyle,
      textContent,
      size: sizeAndPrice.size,
      orientation,
      savedAt: new Date().toLocaleDateString()
    };
    
    const updated = [...savedDesigns, newDesign];
    setSavedDesigns(updated);
    localStorage.setItem('vitthal_saved_designs', JSON.stringify(updated));
    setDesignName('');
    addToast('✓ Design saved!', 'success');
  };

  const loadDesign = (design) => {
    setPhoto(design.photo);
    setFrameStyle(design.frameStyle);
    setMaterial(design.material);
    setGlassFinish(design.glassFinish);
    setMattingStyle(design.mattingStyle);
    setTextContent(design.textContent);
    setSizeAndPrice(sizes.find(s => s.value === design.size));
    setOrientation(design.orientation);
    addToast('✓ Design loaded!', 'success');
  };

  const deleteDesign = (id) => {
    const updated = savedDesigns.filter(d => d.id !== id);
    setSavedDesigns(updated);
    localStorage.setItem('vitthal_saved_designs', JSON.stringify(updated));
    addToast('Design deleted', 'info');
  };

  const addToCart = () => {
    if (!photo) {
      addToast('Please upload and crop photo first!', 'error');
      return;
    }
    
    const cart = JSON.parse(localStorage.getItem('vitthal_cart')) || [];
    const item = {
      _id: 'custom-' + Date.now(),
      name: `Custom ${frameStyle} Frame`,
      price: Math.round(totalPrice / quantity),
      image: photo,
      size: sizeAndPrice.size,
      quantity,
      isCustom: true,
      orientation,
      material,
      glassFinish,
      mattingStyle,
      textContent,
      customizations: {
        frameStyle,
        material,
        glassFinish,
        mattingStyle,
        textContent,
        addText
      }
    };
    
    cart.push(item);
    localStorage.setItem('vitthal_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    addToast(`✓ Added ${quantity} frame(s) to cart!`, 'success');
  };

  const buyNow = () => {
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
            <p>Professional frame customizer with all features</p>
            {/* 3D, Compare removed */}
          </div>

          <CollectionsNav />

          <div className="custom-frame-main">
            {/* Preview Container */}
            <div className="preview-container">
              <div className="preview-card">
                <div className="preview-header">
                  <h3>Live Preview</h3>
                  <span className="size-info">{sizeAndPrice.size} inches • {material}</span>
                </div>

                <div className="frame-visualizer" style={{ 
                    width: orientation === 'vertical' ? '260px' : '360px', 
                    height: orientation === 'vertical' ? '360px' : '260px',
                    border: `${frames.find(f => f.id === frameStyle)?.borderWidth || 8}px solid ${frames.find(f => f.id === frameStyle)?.borderColor || '#d4af37'}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {photo ? <img src={photo} alt="Preview" /> : <div className="empty-preview"><i className="bi bi-image"></i></div>}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>
                    Frame: {frames.find(f => f.id === frameStyle)?.name}
                  </div>

                {/* Removed Material / Glass / Matting summary from UI per request */}

                <div className="price-display">
                  <span className="price-label">Total Price ({quantity}x)</span>
                  <span className="price-amount">₹{totalPrice}</span>
                  {quantity >= 5 && <span className="discount-badge">SAVE UP TO 15%</span>}
                </div>
              </div>
            </div>

            {/* Customization Panel */}
            <div className="customization-panel">
              {/* Photo Upload & Crop */}
              <div className="custom-step">
                <div className="step-header">
                  <i className="bi bi-cloud-upload"></i>
                  <h3>Step 1: Upload & Crop Photo</h3>
                  {photo && <span className="badge-success">✓ Done</span>}
                </div>
                <div className="step-content">
                  {!cropMode ? (
                    <div className="file-upload-box">
                      <div className="file-upload-inner">
                        <i className="bi bi-camera-fill"></i>
                        <p className="upload-main">Click or drag & drop</p>
                        <p className="upload-sub">JPG, PNG, WEBP (Max 5MB)</p>
                      </div>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload}
                        className="file-input"
                      />
                    </div>
                  ) : (
                    <div className="crop-editor">
                      <div style={{ position: 'relative', width: '100%', height: 300, background: '#333' }}>
                        <Cropper
                          image={photo}
                          crop={crop}
                          zoom={cropZoom}
                          rotation={cropRotation}
                          aspect={orientation === 'vertical' ? 3 / 4 : 4 / 3}
                          onCropChange={setCrop}
                          onZoomChange={setCropZoom}
                          onCropComplete={onCropComplete}
                        />
                      </div>
                      <div className="crop-controls">
                        <div className="control-group">
                          <label>Zoom</label>
                          <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.1"
                            value={cropZoom}
                            onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                          />
                          <span>{Math.round(cropZoom * 100)}%</span>
                        </div>
                        <div className="control-group">
                          <label>Rotate</label>
                          <div className="rotate-buttons">
                            <button onClick={() => setCropRotation((r) => r - 90)}>↺ -90°</button>
                            <button onClick={() => setCropRotation(0)}>↻ Reset</button>
                            <button onClick={() => setCropRotation((r) => r + 90)}>↻ +90°</button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button className="btn-crop-done" onClick={handleCropConfirm}>
                            <i className="bi bi-check"></i> Done Cropping
                          </button>
                          <button className="btn" onClick={() => setCropMode(false)} style={{ background: '#eee', color: '#333' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {photoName && <div className="uploaded-info"><i className="bi bi-check-circle-fill"></i><span>{photoName}</span></div>}
                </div>
              </div>

              {/* Frame & Design Options */}
              <div className="custom-step">
                <div className="step-header">
                  <i className="bi bi-palette-fill"></i>
                  <h3>Step 2: Frame Design</h3>
                </div>
                <div className="step-content">
                  <div className="option-group">
                    <label>Frame Style</label>
                    <div className="frames-grid">
                      {frames.map(frame => (
                        <div 
                          key={frame.id}
                          className={`frame-option ${frameStyle === frame.id ? 'selected' : ''}`}
                          onClick={() => setFrameStyle(frame.id)}
                        >
                          <div className="frame-preview-thumb">
                            <img
                              src={normalizeImageUrl(frame.image) || '/assets/images/logo.png'}
                              alt={frame.name}
                              loading="lazy"
                              decoding="async"
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                            {frameStyle === frame.id && <div className="selection-badge"><i className="bi bi-check2"></i></div>}
                          </div>
                          <p className="frame-name">{frame.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="option-group">
                    <label>Material</label>
                    <div className="material-grid">
                      {materials.map(mat => (
                        <button
                          key={mat.id}
                          className={`material-btn ${material === mat.id ? 'selected' : ''}`}
                          onClick={() => setMaterial(mat.id)}
                        >
                          <i className={`bi ${mat.icon}`}></i>
                          <span>{mat.name}</span>
                          {mat.price !== 0 && <small>{mat.price > 0 ? '+' : ''}₹{mat.price}</small>}
                        </button>
                      ))}
                    </div>
                  </div>


                </div>
              </div>

              {/* Size */}
              <div className="custom-step">
                <div className="step-header">
                  <i className="bi bi-border"></i>
                  <h3>Step 3: Size</h3>
                </div>
                <div className="step-content">

                  <div className="option-group">
                    <label>Size</label>
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

                  <div className="option-group">
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
                </div>
              </div>

              {/* Personalization */}
              <div className="custom-step">
                <div className="step-header">
                  <i className="bi bi-type"></i>
                  <h3>Step 4: Add Text (Optional)</h3>
                </div>
                <div className="step-content">
                  <div className="toggle-personalization">
                    <input 
                      type="checkbox" 
                      id="add-text" 
                      checked={addText}
                      onChange={(e) => setAddText(e.target.checked)}
                    />
                    <label htmlFor="add-text">Add custom text</label>
                  </div>

                  {addText && (
                    <div className="text-options">
                      <div className="option-group">
                        <label>Text Content</label>
                        <textarea
                          value={textContent}
                          onChange={(e) => setTextContent(e.target.value.substring(0, 50))}
                          placeholder="Enter your text (max 50 chars)"
                          rows="2"
                        />
                        <small>{textContent.length}/50</small>
                      </div>

                      <div className="option-group">
                        <label>Text Position</label>
                        <select value={textPosition} onChange={(e) => setTextPosition(e.target.value)}>
                          <option value="top">Top</option>
                          <option value="center">Center</option>
                          <option value="bottom">Bottom</option>
                        </select>
                      </div>

                      <div className="option-group">
                        <label>Text Size</label>
                        <div className="size-buttons">
                          {['small', 'medium', 'large'].map(size => (
                            <button
                              key={size}
                              className={`size-btn ${textSize === size ? 'selected' : ''}`}
                              onClick={() => setTextSize(size)}
                            >
                              {size.charAt(0).toUpperCase() + size.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="text-preview">
                        <span style={{ fontSize: textSize === 'small' ? '12px' : textSize === 'medium' ? '16px' : '20px' }}>
                          {textContent || 'Preview'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity & Bulk Pricing */}
              <div className="custom-step">
                <div className="step-header">
                  <i className="bi bi-stack"></i>
                  <h3>Quantity & Bulk Discount</h3>
                </div>
                <div className="step-content">
                  <div className="quantity-selector">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                    <input 
                      type="number" 
                      value={quantity} 
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                    />
                    <button onClick={() => setQuantity(quantity + 1)}>+</button>
                  </div>

                  <div className="bulk-pricing-info">
                    <p><i className="bi bi-percent"></i> <strong>Bulk Discounts Available:</strong></p>
                    <ul>
                      <li>5-9 frames: <strong>5% OFF</strong></li>
                      <li>10-19 frames: <strong>10% OFF</strong></li>
                      <li>20+ frames: <strong>15% OFF</strong></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Save Design */}
              <div className="custom-step">
                <div className="step-header">
                  <i className="bi bi-bookmark-fill"></i>
                  <h3>Save This Design</h3>
                </div>
                <div className="step-content">
                  <div className="save-design-form">
                    <input 
                      type="text"
                      placeholder="Give your design a name..."
                      value={designName}
                      onChange={(e) => setDesignName(e.target.value)}
                    />
                    <button onClick={saveDesign} className="btn-save-design">
                      <i className="bi bi-bookmark"></i> Save Design
                    </button>
                  </div>

                  {savedDesigns.length > 0 && (
                    <div className="saved-designs-list">
                      <h4>Your Saved Designs ({savedDesigns.length})</h4>
                      {savedDesigns.map(design => (
                        <div key={design.id} className="saved-design-item">
                          <img src={design.photo} alt={design.name} />
                          <div className="design-info">
                            <p><strong>{design.name}</strong></p>
                            <small>{design.savedAt}</small>
                          </div>
                          <div className="design-actions">
                            <button onClick={() => loadDesign(design)} title="Load">
                              <i className="bi bi-arrow-clockwise"></i>
                            </button>
                            <button onClick={() => deleteDesign(design.id)} title="Delete">
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
