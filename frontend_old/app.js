document.addEventListener('DOMContentLoaded', function () {
    // 0. Load Dynamic Site Settings
    loadDynamicSettings();
    // 0.1 Load Trending Products
    if (document.getElementById('trending-products-container')) {
        fetchTrendingProducts();
    }

    async function fetchTrendingProducts() {
        const trendingContainer = document.getElementById('trending-products-container');
        if (!trendingContainer) return;

        try {
            const API_URL = window.API_URL || '/api';
            const res = await fetch(`${API_URL}/products/trending`);
            const trendingProductsData = await res.json();

            if (trendingProductsData && trendingProductsData.length > 0) {
                renderTrendingProducts(trendingProductsData);
            }
        } catch (error) {
            console.error('Error fetching trending products:', error);
        }
    }

    function renderTrendingProducts(products) {
        const trendingContainer = document.getElementById('trending-products-container');
        if (!trendingContainer) return;

        trendingContainer.innerHTML = ''; // Clear hardcoded products

        products.forEach(product => {
            const productHtml = `
                <div class="T-product" data-product-id="${product._id}" style="cursor: pointer;" onclick="window.location.href='product-details.html?id=${product._id}'">
                    <div class="img-cover">
                        <div class="img-1" style="background-image: url('${normalizeAppImageUrl(product.images[0])}');"></div>
                        <button class="fev-btn" onclick="event.stopPropagation();">
                            <i class="bi bi-heart"></i>
                        </button>
                        <div class="cart-btn">
                            <button class="Add-to-cart" onclick="event.stopPropagation();"><i class="bi bi-cart"></i> Add to Cart</button>
                        </div>
                    </div>
                    <div class="Trending-product-details">
                        <h4>${product.name}</h4>
                        <div class="T-product-span">
                            <span id="span-name" class="text-[#8a7560] text-sm">${product.category} Collection</span>
                            <span class="text-lg font-semibold">₹${product.basePrice.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            `;
            trendingContainer.innerHTML += productHtml;
        });

        // Re-attach wishlist heart listeners (if applicable)
        if (window.addWishlistButtons) window.addWishlistButtons();
    }

    async function loadDynamicSettings() {
        try {
            const API_URL = window.API_URL || '/api';
            const response = await fetch(`${API_URL}/settings`);
            const settings = await response.json();

            if (settings) {
                // Update Logo
                if (settings.logoUrl) {
                    const logos = document.querySelectorAll('header a img, footer img');
                    logos.forEach(logo => {
                        // Check if it looks like a logo image (header or specific footer logo)
                        if (logo.closest('header') || logo.src.includes('logo')) {
                            logo.src = normalizeAppImageUrl(settings.logoUrl);
                        }
                    });
                }
                // Update Footer About Text if needed
                if (settings.siteName) {
                    const footerCopy = document.querySelector('.footer-bottom');
                    if (footerCopy) {
                        footerCopy.innerHTML = `&copy; ${new Date().getFullYear()} ${settings.siteName}. All rights reserved.`;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading dynamic settings:', error);
        }
    }

    function normalizeAppImageUrl(url) {
        if (!url) return 'assets/images/logo.png';
        if (url.startsWith('https://') && url.includes('s3')) {
            const API_URL = window.API_URL || '/api';
            return `${API_URL}/upload/proxy?url=${encodeURIComponent(url)}`;
        }
        return url;
    }


    /* -----------------------------------------------------------
       1. Navigation & Search
    ----------------------------------------------------------- */
    const headerSearch = document.getElementById('header-search');
    if (headerSearch) {
        headerSearch.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    // Redirect to a listing page with search query
                    window.location.href = `results.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    const select = document.getElementById('category-select');
    if (select) {
        select.value = "";
        select.addEventListener('change', function () {
            if (this.value) window.location.href = `${this.value}.html`;
        });
    }

    const mobileSelect = document.getElementById('category-select-mobile');
    if (mobileSelect) {
        mobileSelect.value = "";
        mobileSelect.addEventListener('change', function () {
            if (this.value) window.location.href = `${this.value}.html`;
        });
    }

    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeMenu = document.querySelector('.close-menu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => mobileMenu.classList.add('active'));

        if (closeMenu) {
            closeMenu.addEventListener('click', () => mobileMenu.classList.remove('active'));
        }

        // Close on link click
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => mobileMenu.classList.remove('active'));
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                mobileMenu.classList.remove('active');
            }
        });
    }


    /* -----------------------------------------------------------
       2. Cart Functionality (LocalStorage)
    ----------------------------------------------------------- */

    // Initialize Cart
    let cart = JSON.parse(localStorage.getItem('vitthal_cart')) || [];
    updateCartCount();

    // Add to Cart Buttons (Global listener for dynamic elements)
    document.body.addEventListener('click', function (e) {
        if (e.target.closest('.Add-to-cart') || e.target.classList.contains('add-cart-btn')) {
            const btn = e.target.closest('.Add-to-cart') || e.target;

            // Get product details
            let product = {};

            // If on Product Details Page
            if (document.querySelector('.product-details-container')) {
                const urlParams = new URLSearchParams(window.location.search);
                product = {
                    id: urlParams.get('id') || Date.now(),
                    name: document.querySelector('.product-title').innerText,
                    price: parsePrice(document.querySelector('.product-price').innerText),
                    image: document.getElementById('main-product-img').src,
                    size: document.querySelector('.size-select') ? document.querySelector('.size-select').value : 'Standard',
                    quantity: 1
                };
            }
            // If on Listing Page (Trending/Category)
            else if (btn.closest('.T-product')) {
                const card = btn.closest('.T-product');
                // Extract price properly handling currency
                const priceText = card.querySelector('.text-lg').innerText;
                const bgImage = card.querySelector('.img-1').style.backgroundImage;
                const imageUrl = bgImage.slice(5, -2); // Remove url('')

                product = {
                    id: card.dataset.productId || Date.now(),
                    name: card.querySelector('h4').innerText,
                    price: parsePrice(priceText),
                    image: imageUrl,
                    size: 'Standard',
                    quantity: 1
                };
            }

            addToCart(product);
            alert('Item added to cart!');
        }
    });

    function addToCart(product) {
        // Check if item exists (simple check by name for now)
        const existingIndex = cart.findIndex(item => item.name === product.name && item.size === product.size);

        if (existingIndex > -1) {
            cart[existingIndex].quantity += 1;
        } else {
            cart.push(product);
        }

        saveCart();
        updateCartCount();
    }

    function saveCart() {
        localStorage.setItem('vitthal_cart', JSON.stringify(cart));
    }

    function updateCartCount() {
        // Re-read cart from storage to get updates from other scripts
        cart = JSON.parse(localStorage.getItem('vitthal_cart')) || [];
        const countEl = document.getElementById('cart-count');
        if (countEl) {
            const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            countEl.innerText = totalItems;
            countEl.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }
    // Initial update
    updateCartCount();
    // Expose globally for other scripts
    window.updateCartCount = updateCartCount;

    function parsePrice(priceStr) {
        return parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
    }


    /* -----------------------------------------------------------
       3. Cart Page Logic
    ----------------------------------------------------------- */
    const cartTableBody = document.querySelector('.cart-table tbody');
    const cartSummary = document.querySelector('.cart-summary');

    if (cartTableBody && window.location.pathname.includes('cart.html')) {
        renderCart();
    }

    function renderCart() {
        if (!cartTableBody) return;
        cartTableBody.innerHTML = '';
        let subtotal = 0;

        if (cart.length === 0) {
            cartTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Your cart is empty.</td></tr>';
        } else {
            cart.forEach((item, index) => {
                const total = item.price * item.quantity;
                subtotal += total;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div class="cart-product" style="cursor: pointer;" onclick="window.location.href='${item.id && item.id.toString().startsWith('custom-') ? 'custome_frame.html' : 'product-details.html?id=' + item.id}'">
                            <img src="${item.image}" alt="${item.name}">
                            <div>
                                <h4 style="margin:0;">${item.name}</h4>
                                <small>${item.size}</small>
                            </div>
                        </div>
                    </td>
                    <td>₹${item.price}</td>
                    <td><input type="number" value="${item.quantity}" min="1" class="quantity-input" data-index="${index}"></td>
                    <td>₹${total}</td>
                    <td><button class="remove-btn" data-index="${index}"><i class="bi bi-trash"></i></button></td>
                `;
                cartTableBody.appendChild(row);
            });
        }

        // Update Summary
        if (cartSummary) {
            const summaryRows = cartSummary.querySelectorAll('.summary-row span:last-child');
            if (summaryRows.length >= 3) {
                summaryRows[0].innerText = '₹' + subtotal;
                summaryRows[2].innerText = '₹' + subtotal;
            }
        }

        // Add Listeners for inputs and delete
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = e.target.dataset.index;
                const newQty = parseInt(e.target.value);
                if (newQty > 0) {
                    cart[index].quantity = newQty;
                    saveCart();
                    renderCart();
                }
            });
        });

        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.closest('button').dataset.index;
                cart.splice(index, 1);
                saveCart();
                renderCart();
            });
        });
    }


    /* -----------------------------------------------------------
       4. Product Details Logic
    ----------------------------------------------------------- */
    const sizeSelect = document.querySelector('.size-select');
    const priceDisplay = document.querySelector('.product-price');

    if (sizeSelect && priceDisplay) {
        const basePrice = parsePrice(priceDisplay.innerText);

        sizeSelect.addEventListener('change', function () {
            // Very simple simulation: Extract price from the option text if present
            // e.g., "12 x 15 - ₹1,899"
            const selectedText = this.options[this.selectedIndex].text;
            const match = selectedText.match(/₹([0-9,]+)/);
            if (match) {
                priceDisplay.innerHTML = `₹${match[1]} <span class="old-price">₹${Math.round(parsePrice(match[1]) * 1.3)}</span> <span class="discount"></span>`;
            }
        });
    }




    /* -----------------------------------------------------------
       5. Form Simulations
    ----------------------------------------------------------- */

    // Migrate old wishlist if exists
    const oldWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (oldWishlist.length > 0) {
        let newWishlist = JSON.parse(localStorage.getItem('vitthal_wishlist') || '[]');
        oldWishlist.forEach(item => {
            const id = typeof item === 'object' ? (item._id || item.id) : item;
            if (id && !newWishlist.includes(id)) newWishlist.push(id);
        });
        localStorage.setItem('vitthal_wishlist', JSON.stringify(newWishlist));
        localStorage.removeItem('wishlist');
    }

    // Checkout Form
    const checkoutBtn = document.querySelector('.checkout-container .checkout-btn');
    if (checkoutBtn) {
        const payRadios = document.querySelectorAll('input[name="payment"]');
        checkoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Stop default to handle logic
            alert('Order Placed Successfully! Redirecting to Home...');
            localStorage.removeItem('vitthal_cart'); // Clear cart
            window.location.href = 'index.html';
        });
    }

    // Other Scroll Logic (Trending)
    const backArrow = document.querySelector('.back-arow');
    const forwardArrow = document.querySelector('.forward-arow');
    const trendingProducts = document.querySelector('.Trending-products');

    if (backArrow && forwardArrow && trendingProducts) {
        function scrollTrending(direction) {
            const productWidth = trendingProducts.clientWidth; // Scroll one screen width
            trendingProducts.scrollBy({
                left: direction * (productWidth / 2),
                behavior: 'smooth'
            });
        }
        backArrow.addEventListener('click', () => scrollTrending(-1));
        forwardArrow.addEventListener('click', () => scrollTrending(1));
    }

    // Heart Logic
    const heartButtons = document.querySelectorAll('.fev-btn');
    heartButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.toggle('liked');
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('bi-heart');
                icon.classList.toggle('bi-heart-fill');
            }
        });
    });

    // Resize Logic
    function adjustForScreenSize() {
        const width = window.innerWidth;
    }
    window.addEventListener('resize', adjustForScreenSize);
    adjustForScreenSize();

    /* -----------------------------------------------------------
       6. API Integration (Auth & Orders)
    ----------------------------------------------------------- */
    const API_URL = window.API_URL || '/api';

    // Helper: Get Token
    const getToken = () => localStorage.getItem('vitthal_token');
    const getUser = () => JSON.parse(localStorage.getItem('vitthal_user'));

    // Update UI based on Auth State
    function updateAuthUI() {
        const user = getUser();
        const personIcon = document.getElementById('person');
        if (personIcon && user) {
            personIcon.innerHTML = `<span style="font-size:1.2rem; font-weight:bold; color:#fa873b; border:2px solid #fa873b; border-radius:50%; width:25px; height:25px; display:flex; align-items:center; justify-content:center;">${user.name.charAt(0).toUpperCase()}</span>`;
            personIcon.href = 'profile.html';
            personIcon.title = `Logged in as ${user.name}`;
        }
    }
    updateAuthUI();

    // LOGIN Logic
    if (window.location.pathname.includes('login.html')) {
        const form = document.querySelector('.auth-box form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const emailInput = form.querySelector('input[type="email"]');
                const passwordInput = form.querySelector('input[type="password"]');

                if (!emailInput || !passwordInput) {
                    alert('Form fields not found');
                    return;
                }

                const email = emailInput.value.trim();
                const password = passwordInput.value.trim();

                if (!email || !password) {
                    alert('Please fill in all fields');
                    return;
                }

                try {
                    const res = await fetch(`${API_URL}/users/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });
                    const data = await res.json();

                    if (res.ok) {
                        localStorage.setItem('vitthal_token', data.token);
                        localStorage.setItem('vitthal_user', JSON.stringify(data));
                        alert('Login Successful!');

                        // Redirect admin users to admin panel
                        if (data.isAdmin) {
                            window.location.href = 'admin.html';
                        } else {
                            window.location.href = 'index.html';
                        }
                    } else {
                        alert(data.message || 'Login failed');
                    }
                } catch (err) {
                    console.error(err);
                    alert('Server error. Make sure backend is running on http://localhost:5000');
                }
            });
        }
    }

    // SIGNUP Logic
    if (window.location.pathname.includes('signup.html')) {
        const form = document.querySelector('.auth-box form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const inputs = form.querySelectorAll('input');

                if (inputs.length < 4) {
                    alert('Form fields not found');
                    return;
                }

                const name = inputs[0].value.trim();
                const email = inputs[1].value.trim();
                const password = inputs[2].value.trim();
                const confirmPass = inputs[3].value.trim();

                if (!name || !email || !password || !confirmPass) {
                    alert('Please fill in all fields');
                    return;
                }

                if (password !== confirmPass) {
                    alert('Passwords do not match');
                    return;
                }

                if (password.length < 6) {
                    alert('Password must be at least 6 characters long');
                    return;
                }

                try {
                    const res = await fetch(`${API_URL}/users`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, password })
                    });
                    const data = await res.json();

                    if (res.ok) {
                        localStorage.setItem('vitthal_token', data.token);
                        localStorage.setItem('vitthal_user', JSON.stringify(data));
                        alert('Registration Successful!');
                        window.location.href = 'index.html';
                    } else {
                        alert(data.message || 'Registration failed');
                    }
                } catch (err) {
                    console.error(err);
                    alert('Server error. Make sure backend is running on http://localhost:5000');
                }
            });
        }
    }

    // ORDER PLACEMENT Logic (Checkout)
    if (window.location.pathname.includes('checkout.html')) {
        renderCheckoutSummary();
        const placeOrderBtn = document.querySelector('.checkout-btn');
        if (placeOrderBtn) {

            placeOrderBtn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (cart.length === 0) {
                    alert('Your cart is empty');
                    return;
                }

                const user = getUser();

                const firstName = document.getElementById('checkout-first-name').value.trim();
                const lastName = document.getElementById('checkout-last-name').value.trim();
                const phone = document.getElementById('checkout-phone').value.trim();
                const email = document.getElementById('checkout-email').value.trim();
                const address = document.getElementById('checkout-address').value.trim();
                const city = document.getElementById('checkout-city').value.trim();
                const state = document.getElementById('checkout-state').value.trim();
                const pincode = document.getElementById('checkout-pincode').value.trim();

                if (!firstName || !lastName || !phone || !email || !address || !city || !state || !pincode) {
                    alert('Please fill in all required fields');
                    return;
                }

                const paymentMethodInput = document.querySelector('input[name="payment"]:checked');
                let paymentMethod = 'Cash on Delivery';
                if (paymentMethodInput) {
                    const val = paymentMethodInput.value;
                    if (val === 'card') paymentMethod = 'Credit/Debit Card';
                    else if (val === 'upi') paymentMethod = 'UPI';
                    else paymentMethod = 'Cash on Delivery';
                }

                const addressData = {
                    customerName: firstName + ' ' + lastName,
                    phone: phone,
                    email: email,
                    address: address,
                    city: city,
                    postalCode: pincode,
                };

                const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

                // If online payment is selected, create Razorpay order first
                if (paymentMethod !== 'Cash on Delivery') {
                    try {
                        const paymentRes = await fetch(`${API_URL}/payment/create-order`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': user ? `Bearer ${getToken()}` : ''
                            },
                            body: JSON.stringify({
                                amount: totalPrice,
                                currency: 'INR'
                            })
                        });

                        if (!paymentRes.ok) {
                            throw new Error('Failed to create payment order');
                        }

                        const paymentData = await paymentRes.json();

                        // Initialize Razorpay
                        const options = {
                            key: paymentData.key,
                            amount: paymentData.amount,
                            currency: paymentData.currency,
                            order_id: paymentData.orderId,
                            name: 'Vitthal Photo Frames',
                            description: 'Photo Frame Purchase',
                            prefill: {
                                name: addressData.customerName,
                                email: addressData.email,
                                contact: addressData.phone
                            },
                            handler: async function (response) {
                                // Verify payment
                                try {
                                    const verifyRes = await fetch(`${API_URL}/payment/verify`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': user ? `Bearer ${getToken()}` : ''
                                        },
                                        body: JSON.stringify({
                                            razorpay_payment_id: response.razorpay_payment_id,
                                            razorpay_order_id: response.razorpay_order_id,
                                            razorpay_signature: response.razorpay_signature
                                        })
                                    });

                                    if (verifyRes.ok) {
                                        // Payment verified, now place the order
                                        await placeOrder(paymentMethod, addressData, totalPrice, cart, user);
                                    } else {
                                        alert('Payment verification failed. Please try again.');
                                    }
                                } catch (error) {
                                    console.error('Payment verification error:', error);
                                    alert('Payment verification failed. Please contact support.');
                                }
                            },
                            modal: {
                                ondismiss: function () {
                                    alert('Payment cancelled by user');
                                }
                            }
                        };

                        const rzp = new Razorpay(options);
                        rzp.open();

                    } catch (error) {
                        console.error('Payment initialization error:', error);
                        alert('Failed to initialize payment. Please try again or select Cash on Delivery.');
                    }
                } else {
                    // Cash on Delivery - place order directly
                    await placeOrder(paymentMethod, addressData, totalPrice, cart, user);
                }
            };
        }
    }

    // Render Checkout Summary
    function renderCheckoutSummary() {
        const summaryContainer = document.getElementById('order-items-summary');
        const subtotalEl = document.getElementById('summary-subtotal');
        const totalEl = document.getElementById('summary-total');

        if (!summaryContainer || cart.length === 0) return;

        summaryContainer.innerHTML = '';
        let subtotal = 0;

        cart.forEach(item => {
            const total = item.price * item.quantity;
            subtotal += total;

            const itemHtml = `
                <div style="display:flex; gap:10px; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:15px;">
                    <img src="${item.image}" style="width:50px; height:50px; border-radius:5px; object-fit:cover;">
                    <div>
                        <p style="margin:0; font-weight:bold;">${item.name} <span style="color:#777;">x${item.quantity}</span></p>
                        <small>Size: ${item.size}</small>
                        <p style="margin:0; color:#fa873b;">₹${item.price.toLocaleString()}</p>
                    </div>
                </div>
            `;
            summaryContainer.innerHTML += itemHtml;
        });

        subtotalEl.textContent = `₹${subtotal.toLocaleString()}`;
        totalEl.textContent = `₹${subtotal.toLocaleString()}`;
    }

    // Place Order Function
    async function placeOrder(paymentMethod, addressData, totalPrice, cart, user) {
        const orderData = {
            ...addressData,
            user: user ? user._id : null, // Link order to logged-in user
            orderItems: cart,
            totalPrice,
            paymentMethod,
            shippingAddress: {
                address: addressData.address,
                city: addressData.city,
                postalCode: addressData.postalCode,
                country: 'India',
                phone: addressData.phone
            },
            status: 'pending',
            date: new Date().toISOString()
        };

        try {
            const res = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user ? `Bearer ${getToken()}` : ''
                },
                body: JSON.stringify(orderData)
            });

            if (res.ok) {
                const createdOrder = await res.json();

                // Save order to localStorage
                const orders = JSON.parse(localStorage.getItem('vitthal_orders')) || [];
                orders.push(createdOrder);
                localStorage.setItem('vitthal_orders', JSON.stringify(orders));

                localStorage.removeItem('vitthal_cart');
                window.location.href = `order-success.html?id=${createdOrder._id}`;
            } else {
                const errData = await res.json();
                alert('Order Failed: ' + (errData.message || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);

            // Save order to localStorage as fallback
            const orders = JSON.parse(localStorage.getItem('vitthal_orders')) || [];
            const offlineOrder = {
                ...orderData,
                _id: 'offline-' + Date.now()
            };
            orders.push(offlineOrder);
            localStorage.setItem('vitthal_orders', JSON.stringify(orders));

            localStorage.removeItem('vitthal_cart');
            window.location.href = `order-success.html?id=${offlineOrder._id}`;
        }
    }

    /* -----------------------------------------------------------
       Wishlist/Heart Functionality
    ----------------------------------------------------------- */

    // Export to window so dynamic cards can call it
    window.addWishlistButtons = async function () {
        const productCards = document.querySelectorAll('.T-product');

        productCards.forEach(async card => {
            let heartBtn = card.querySelector('.heart-btn') || card.querySelector('.fev-btn');

            if (!heartBtn) {
                heartBtn = document.createElement('button');
                heartBtn.className = 'heart-btn';
                heartBtn.innerHTML = '<i class="bi bi-heart"></i>';
                heartBtn.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: white;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                    transition: all 0.3s;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                `;

                const imgContainer = card.querySelector('.img-1') || card.querySelector('.img-cover');
                if (imgContainer) {
                    imgContainer.style.position = 'relative';
                    imgContainer.appendChild(heartBtn);
                }
            }

            if (heartBtn && !heartBtn.dataset.listenerAttached) {
                attachHeartListener(heartBtn, card);
                heartBtn.dataset.listenerAttached = 'true';
            }

            // Sync initial state
            syncHeartState(heartBtn, card);
        });
    }

    async function syncHeartState(btn, card) {
        const productId = card.dataset.productId;
        const productName = card.querySelector('h4')?.innerText || '';

        let isIn = false;
        if (window.isInWishlist && productId) {
            isIn = await window.isInWishlist(productId);
        } else {
            const localWishlist = JSON.parse(localStorage.getItem('vitthal_wishlist') || '[]');
            isIn = localWishlist.some(id => id === productId);
        }

        if (isIn) {
            btn.classList.add('active');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.remove('bi-heart');
                icon.classList.add('bi-heart-fill');
            }
        }
    }

    function attachHeartListener(btn, card) {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const productId = card.dataset.productId;
            const productName = card.querySelector('h4')?.innerText || 'Product';
            const priceText = card.querySelector('.text-lg')?.innerText || '0';
            const bgImage = card.querySelector('.img-1')?.style.backgroundImage || '';
            const imageUrl = bgImage.includes('url') ? bgImage.slice(5, -2) : '';

            const product = {
                _id: productId,
                name: productName,
                price: parsePrice(priceText),
                imageUrl: imageUrl
            };

            if (window.addToWishlist && window.removeFromWishlist && window.isInWishlist && productId) {
                const alreadyIn = await window.isInWishlist(productId);

                if (alreadyIn) {
                    await window.removeFromWishlist(productId);
                    btn.classList.remove('active');
                    const icon = btn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('bi-heart-fill');
                        icon.classList.add('bi-heart');
                    }
                } else {
                    const added = await window.addToWishlist(product);
                    if (added) {
                        btn.classList.add('active');
                        const icon = btn.querySelector('i');
                        if (icon) {
                            icon.classList.remove('bi-heart');
                            icon.classList.add('bi-heart-fill');
                        }
                    }
                }
            } else {
                // Fallback to localStorage
                let wishlist = JSON.parse(localStorage.getItem('vitthal_wishlist') || '[]');
                const exists = wishlist.includes(productId);

                if (btn.classList.contains('active') || exists) {
                    wishlist = wishlist.filter(id => id !== productId);
                    localStorage.setItem('vitthal_wishlist', JSON.stringify(wishlist));
                    btn.classList.remove('active');
                    const icon = btn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('bi-heart-fill');
                        icon.classList.add('bi-heart');
                    }
                    showWishlistNotification('Removed from Wishlist', 'info');
                } else {
                    wishlist.push(productId);
                    localStorage.setItem('vitthal_wishlist', JSON.stringify(wishlist));
                    btn.classList.add('active');
                    const icon = btn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('bi-heart');
                        icon.classList.add('bi-heart-fill');
                    }
                    showWishlistNotification('✓ Added to Wishlist!', 'success');
                }
            }
        });
    }

    // Add custom styles for heart button
    const heartStyles = document.createElement('style');
    heartStyles.textContent = `
        .heart-btn {
            color: #999;
            transition: all 0.3s !important;
        }
        
        .heart-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        
        .heart-btn.active {
            color: #fa873b;
            background: #fff3e0 !important;
        }
        
        .heart-btn.active:hover {
            color: #e67e2f;
        }
    `;
    document.head.appendChild(heartStyles);

    // Show wishlist notification (Now using themed showToast)
    function showWishlistNotification(message, type = 'info') {
        window.showToast(message, type);
    }

    // Add notification animations
    const notifStyles = document.createElement('style');
    notifStyles.textContent = `
        @keyframes slideInNotif {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutNotif {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(notifStyles);

    // Initialize wishlist buttons on page load and when products are dynamically loaded
    addWishlistButtons();

    // Re-add buttons if products are dynamically loaded
    const observer = new MutationObserver(() => {
        addWishlistButtons();
    });

    const productsContainer = document.querySelector('.products-container') || document.body;
    observer.observe(productsContainer, { childList: true, subtree: true });

    // --- Social & OTP Login Handlers ---
    const googleLoginBtn = document.getElementById('google-login');
    const phoneLoginBtn = document.getElementById('phone-login');
    const emailOTPBtn = document.getElementById('email-otp-login');
    const otpSection = document.getElementById('otp-entry-section');
    const loginForm = document.getElementById('login-form-container');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    const otpInputs = document.querySelectorAll('.otp-input');

    // Login logic for standard form
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const res = await fetch(`${API_URL}/users/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('vitthal_token', data.token);
                    localStorage.setItem('vitthal_user', JSON.stringify(data.user));
                    alert('Login successful!');
                    window.location.href = 'index.html';
                } else {
                    alert(data.message || 'Login failed');
                }
            } catch (err) {
                console.error(err);
                alert('Server error');
            }
        };
    }

    // Toast Notification System
    function showToast(message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'bi-check-circle-fill',
            error: 'bi-exclamation-triangle-fill',
            info: 'bi-info-circle-fill'
        };

        toast.innerHTML = `
            <div class="toast-icon"><i class="bi ${icons[type] || icons.success}"></i></div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <div class="toast-progress"></div>
        `;

        container.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }
    window.showToast = showToast;

});
