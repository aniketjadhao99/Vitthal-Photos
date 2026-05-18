// custome_frame.js - Custom Frame Logic
document.addEventListener('DOMContentLoaded', function () {
    const framePreview = document.getElementById('frame-preview');
    const previewImage = document.getElementById('preview-image');
    const emptyMsg = document.getElementById('empty-msg');
    const priceDisplay = document.getElementById('price-display');
    const photoUpload = document.getElementById('photo-upload');
    const frameThumbs = document.querySelectorAll('.frame-thumb');
    const orientationBtns = document.querySelectorAll('.toggle-btn');
    const sizeSelect = document.getElementById('size-select');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const buyNowBtn = document.getElementById('Buy-now-btn');
    const cropControls = document.getElementById('crop-controls');
    
    if (!photoUpload || !framePreview) {
        console.error('Core elements not found');
        return;
    }

    let selectedFrame = 'ornate';
    let selectedOrientation = 'vertical';
    let selectedSize = '8x10';
    let selectedPrice = 500;
    let uploadedImage = null;

    const frameStyles = {
        ornate: { type: 'image', value: 'https://img.freepik.com/free-vector/baroque-stucco-gold-frame-vector-floral-design_53876-170725.jpg' },
        vintage: { type: 'image', value: 'https://img.freepik.com/free-vector/realistic-gold-frame_1017-6401.jpg' },
        modern: { type: 'image', value: 'https://img.freepik.com/free-vector/empty-golden-frame-vector_53876-172151.jpg' }
    };

    const sizeData = {
        '5x7': { width: 150, height: 210, price: 400 },
        '8x10': { width: 240, height: 300, price: 500 },
        '9x11.5': { width: 270, height: 345, price: 600 },
        '10x12': { width: 300, height: 360, price: 700 },
        '12x16': { width: 360, height: 480, price: 900 },
        '16x20': { width: 480, height: 600, price: 1200 },
        '12x18': { width: 360, height: 540, price: 1000 },
        '15x19.5': { width: 450, height: 585, price: 1300 },
        '18x24': { width: 540, height: 720, price: 1500 },
        '20x28': { width: 600, height: 840, price: 1800 },
        '24x36': { width: 720, height: 1080, price: 2200 },
        '2x4': { width: 720, height: 1440, price: 2500 },
        '3x6': { width: 1080, height: 2160, price: 3500 },
        '4x8': { width: 1440, height: 2880, price: 4500 }
    };

    // Handle photo upload
    photoUpload.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            // Validation
            if (file.size > 15 * 1024 * 1024) { 
                showToast('File size must be less than 15MB', 'error');
                this.value = '';
                return;
            }

            const reader = new FileReader();
            const loader = document.getElementById('preview-loader');
            
            if (loader) loader.style.display = 'flex';
            if (emptyMsg) emptyMsg.style.display = 'none';

            reader.onerror = () => {
                showToast('Error reading file', 'error');
                if (loader) loader.style.display = 'none';
            };

            reader.onload = function (e) {
                const img = new Image();
                img.onerror = () => {
                    showToast('Invalid image file', 'error');
                    if (loader) loader.style.display = 'none';
                };
                img.onload = function() {
                    uploadedImage = e.target.result;
                    previewImage.src = uploadedImage;
                    
                    // Auto-detect orientation based on image aspect ratio
                    const aspectRatio = img.naturalWidth / img.naturalHeight;
                    if (aspectRatio > 1.1) {
                        selectedOrientation = 'horizontal';
                        updateOrientationUI('horizontal');
                    } else if (aspectRatio < 0.9) {
                        selectedOrientation = 'vertical';
                        updateOrientationUI('vertical');
                    }

                    if (loader) loader.style.display = 'none';
                    previewImage.style.display = 'block';
                    if (cropControls) cropControls.style.display = 'flex';
                    
                    // Re-calculate preview immediately
                    updatePreview();
                    showToast('Photo uploaded successfully!', 'success');
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Fallback click handler
    const uploadWrapper = document.querySelector('.custom-file-input');
    if (uploadWrapper) {
        uploadWrapper.addEventListener('click', () => photoUpload.click());
    }

    function updateOrientationUI(value) {
        orientationBtns.forEach(btn => {
            const isActive = btn.getAttribute('data-value') === value;
            btn.classList.toggle('active', isActive);
            const radio = btn.querySelector('input');
            if (radio) radio.checked = isActive;
        });
    }

    // Handle frame selection
    frameThumbs.forEach(thumb => {
        thumb.addEventListener('click', function () {
            frameThumbs.forEach(t => t.classList.remove('selected'));
            this.classList.add('selected');
            selectedFrame = this.getAttribute('data-frame');
            updatePreview();
        });
    });

    // Handle orientation change
    orientationBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            orientationBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedOrientation = this.getAttribute('data-value');
            this.querySelector('input').checked = true;
            updatePreview();
        });
    });

    // Handle size selection
    sizeSelect.addEventListener('change', function () {
        const opt = this.options[this.selectedIndex];
        selectedSize = this.value;
        selectedPrice = parseInt(opt.dataset.price);
        priceDisplay.textContent = `₹${selectedPrice}`;
        updatePreview();
    });

    function updatePreview() {
        if (!framePreview) return;

        const frameStyle = frameStyles[selectedFrame];
        if (frameStyle.type === 'image') {
            // Dynamic border based on orientation
            const borderThickness = selectedOrientation === 'horizontal' ? '30px' : '35px';
            framePreview.style.border = `${borderThickness} solid transparent`;
            framePreview.style.borderImage = `url(${frameStyle.value}) 120 round`;
        }

        const containerRect = framePreview.parentElement.getBoundingClientRect();
        const maxVisualWidth = Math.min(containerRect.width - 60, 500);
        const maxVisualHeight = 550;
        
        const sizeInfo = sizeData[selectedSize];
        let targetWidth = sizeInfo.width;
        let targetHeight = sizeInfo.height;

        // If orientation is explicitly horizontal, swap dimensions for the size
        if (selectedOrientation === 'horizontal') {
            [targetWidth, targetHeight] = [targetHeight, targetWidth];
        }

        // Calculate the base ratio from the selected size
        let ratio = targetWidth / targetHeight;

        // CRITICAL: If an image is uploaded, we update the frame shape to match the IMAGE's aspect ratio
        // as requested by the user.
        if (uploadedImage && previewImage.naturalWidth) {
            ratio = previewImage.naturalWidth / previewImage.naturalHeight;
        }

        let w, h;
        if (ratio > 1) { // Landscape
            w = maxVisualWidth;
            h = w / ratio;
            if (h > maxVisualHeight) {
                h = maxVisualHeight;
                w = h * ratio;
            }
        } else { // Portrait
            h = maxVisualHeight;
            w = h * ratio;
            if (w > maxVisualWidth) {
                w = maxVisualWidth;
                h = w / ratio;
            }
        }

        framePreview.style.width = `${w}px`;
        framePreview.style.height = `${h}px`;

        if (uploadedImage) {
            previewImage.style.width = '100%';
            previewImage.style.height = '100%';
            previewImage.style.objectFit = 'contain'; // Changed to contain to respect user's requested "shape"
            previewImage.style.display = 'block';
        }
    }

    // Add to cart
    addToCartBtn.addEventListener('click', function () {
        if (!uploadedImage) {
            showToast('Please upload a photo first.', 'error');
            return;
        }

        compressImage(uploadedImage, (compressedImg) => {
            const cartItem = {
                id: 'custom-' + Date.now(),
                name: `Custom Frame (${selectedSize})`,
                size: selectedSize,
                price: selectedPrice,
                image: compressedImg,
                frame: selectedFrame,
                orientation: selectedOrientation,
                quantity: 1
            };

            const cartItems = JSON.parse(localStorage.getItem('vitthal_cart')) || [];
            cartItems.push(cartItem);

            try {
                localStorage.setItem('vitthal_cart', JSON.stringify(cartItems));
                if (window.updateCartCount) window.updateCartCount();
                showToast('Custom frame added to cart!', 'success');
            } catch (e) {
                showToast('Cart is full. Use a smaller image.', 'error');
            }
        });
    });

    // Buy Now
    buyNowBtn.addEventListener('click', function () {
        if (!uploadedImage) {
            showToast('Please upload a photo first.', 'error');
            return;
        }

        compressImage(uploadedImage, (compressedImg) => {
            const cartItem = {
                id: 'custom-' + Date.now(),
                name: `Custom Frame (${selectedSize})`,
                size: selectedSize,
                price: selectedPrice,
                image: compressedImg,
                frame: selectedFrame,
                orientation: selectedOrientation,
                quantity: 1
            };

            const cartItems = JSON.parse(localStorage.getItem('vitthal_cart')) || [];
            cartItems.push(cartItem);
            localStorage.setItem('vitthal_cart', JSON.stringify(cartItems));
            window.location.href = 'checkout.html';
        });
    });

    function compressImage(base64Str, callback) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const max = 800;
            if (width > height) {
                if (width > max) { height *= max / width; width = max; }
            } else {
                if (height > max) { width *= max / height; height = max; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = base64Str;
    }

    // Helper for toasts (assuming toast system exists in app.js/style.css)
    function showToast(msg, type) {
        if (window.showToast) {
            window.showToast(msg, type);
        } else {
            alert(msg);
        }
    }

    // Cropping Tools
    const startCropBtn = document.getElementById('start-crop-btn');
    const applyCropBtn = document.getElementById('apply-crop-btn');
    const cancelCropBtn = document.getElementById('cancel-crop-btn');

    let isCropping = false;
    let isSelecting = false;
    let selStart = { x: 0, y: 0 };

    const selectionDiv = document.createElement('div');
    selectionDiv.className = 'selection';
    framePreview.appendChild(selectionDiv);

    function endCropMode() {
        isCropping = false;
        isSelecting = false;
        selectionDiv.style.display = 'none';
        startCropBtn.style.display = 'inline-block';
        applyCropBtn.style.display = 'none';
        cancelCropBtn.style.display = 'none';
        framePreview.style.cursor = 'default';
        previewImage.style.objectFit = 'cover';
    }

    startCropBtn.addEventListener('click', function () {
        if (!uploadedImage) return;
        isCropping = true;
        previewImage.style.objectFit = 'contain';
        startCropBtn.style.display = 'none';
        applyCropBtn.style.display = 'inline-block';
        cancelCropBtn.style.display = 'inline-block';
        framePreview.style.cursor = 'crosshair';
        showToast('Click and drag on the image to select area', 'info');
    });

    framePreview.addEventListener('mousedown', function (e) {
        if (!isCropping) return;
        isSelecting = true;
        const rect = framePreview.getBoundingClientRect();
        selStart.x = e.clientX - rect.left;
        selStart.y = e.clientY - rect.top;
        selectionDiv.style.left = selStart.x + 'px';
        selectionDiv.style.top = selStart.y + 'px';
        selectionDiv.style.width = '0px';
        selectionDiv.style.height = '0px';
        selectionDiv.style.display = 'block';
    });

    framePreview.addEventListener('mousemove', function (e) {
        if (!isCropping || !isSelecting) return;
        const rect = framePreview.getBoundingClientRect();
        const curX = e.clientX - rect.left;
        const curY = e.clientY - rect.top;
        const left = Math.min(selStart.x, curX);
        const top = Math.min(selStart.y, curY);
        const w = Math.abs(curX - selStart.x);
        const h = Math.abs(curY - selStart.y);
        selectionDiv.style.left = left + 'px';
        selectionDiv.style.top = top + 'px';
        selectionDiv.style.width = w + 'px';
        selectionDiv.style.height = h + 'px';
    });

    window.addEventListener('mouseup', function () {
        isSelecting = false;
    });

    applyCropBtn.addEventListener('click', function () {
        if (!uploadedImage) return;
        if (selectionDiv.style.width === '0px') {
            showToast('Please select an area first', 'error');
            return;
        }

        const imgRect = previewImage.getBoundingClientRect();
        const selRect = selectionDiv.getBoundingClientRect();

        const sxClient = Math.max(selRect.left, imgRect.left);
        const syClient = Math.max(selRect.top, imgRect.top);
        const exClient = Math.min(selRect.right, imgRect.right);
        const eyClient = Math.min(selRect.bottom, imgRect.bottom);
        
        const swClient = Math.max(1, exClient - sxClient);
        const shClient = Math.max(1, eyClient - syClient);

        const scaleX = previewImage.naturalWidth / imgRect.width;
        const scaleY = previewImage.naturalHeight / imgRect.height;

        const sx = (sxClient - imgRect.left) * scaleX;
        const sy = (syClient - imgRect.top) * scaleY;
        const sw = swClient * scaleX;
        const sh = shClient * scaleY;

        const srcImg = new Image();
        srcImg.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(sw);
            canvas.height = Math.round(sh);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(srcImg, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            uploadedImage = canvas.toDataURL('image/jpeg', 0.95);
            previewImage.src = uploadedImage;
            endCropMode();
            updatePreview();
        };
        srcImg.src = uploadedImage;
    });

    cancelCropBtn.addEventListener('click', endCropMode);

    // Initial state
    updatePreview();
});
