// Wishlist Management Script

// API base (fallback to same-origin API)
const API = window.API_URL || '/api';

// Get user token
function getToken() {
    return localStorage.getItem('vitthal_token');
}

// Get user data
function getUser() {
    const user = localStorage.getItem('vitthal_user');
    return user ? JSON.parse(user) : null;
}

// Get wishlist from API
async function getWishlist() {
    const token = getToken();

    if (token) {
        try {
            const response = await fetch(`${API}/wishlist`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        }
    }

    // Fallback to localStorage (used by guest users)
    const localWishlist = localStorage.getItem('vitthal_wishlist');
    return localWishlist ? JSON.parse(localWishlist) : [];
}

// Add item to wishlist
async function addToWishlist(product) {
    const token = getToken();

    if (token) {
        // Use API
        try {
            const response = await fetch(`${API}/wishlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId: product._id })
            });

            if (response.ok) {
                // Keep localStorage in sync
                let wishlist = JSON.parse(localStorage.getItem('vitthal_wishlist') || '[]');
                if (!wishlist.includes(product._id)) {
                    wishlist.push(product._id);
                    localStorage.setItem('vitthal_wishlist', JSON.stringify(wishlist));
                }
                showNotification('✓ Added to Wishlist!', 'success');
                return true;
            } else {
                const error = await response.json();
                // If the error says it's already in wishlist, let's sync local storage just in case
                if (error.message && error.message.includes('already')) {
                    let wishlist = JSON.parse(localStorage.getItem('vitthal_wishlist') || '[]');
                    if (!wishlist.includes(product._id)) {
                        wishlist.push(product._id);
                        localStorage.setItem('vitthal_wishlist', JSON.stringify(wishlist));
                    }
                }
                showNotification(error.message || 'Failed to add to wishlist', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            showNotification('Error adding to wishlist', 'error');
            return false;
        }
    } else {
        // Fallback to localStorage
        const wishlist = JSON.parse(localStorage.getItem('vitthal_wishlist') || '[]');
        const exists = wishlist.includes(product._id);

        if (!exists) {
            wishlist.push(product._id);
            localStorage.setItem('vitthal_wishlist', JSON.stringify(wishlist));
            showNotification('✓ Added to Wishlist!', 'success');
            return true;
        } else {
            showNotification('Already in Wishlist!', 'info');
            return false;
        }
    }
}

// Remove from wishlist
async function removeFromWishlist(productId) {
    const token = getToken();

    if (token) {
        // Use API
        try {
            const response = await fetch(`${API}/wishlist/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                // Keep localStorage in sync
                let wishlist = JSON.parse(localStorage.getItem('vitthal_wishlist') || '[]');
                wishlist = wishlist.filter(item => item !== productId);
                localStorage.setItem('vitthal_wishlist', JSON.stringify(wishlist));

                showNotification('✓ Removed from Wishlist', 'success');
                loadWishlist();
                return true;
            }
        } catch (error) {
            console.error('Error removing from wishlist:', error);
        }
    }

    // Fallback to localStorage
    let wishlist = JSON.parse(localStorage.getItem('vitthal_wishlist') || '[]');
    wishlist = wishlist.filter(item => item !== productId);
    localStorage.setItem('vitthal_wishlist', JSON.stringify(wishlist));
    showNotification('✓ Removed from Wishlist', 'success');
    loadWishlist();
}

// Check if product is in wishlist
async function isInWishlist(productId) {
    const token = getToken();

    if (token) {
        // Use API
        try {
            const response = await fetch(`${API}/wishlist/check/${productId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                return data.inWishlist;
            }
        } catch (error) {
            console.error('Error checking wishlist:', error);
        }
    }

    // Fallback to localStorage (use the same key as dynamic-products.js)
    const wishlist = JSON.parse(localStorage.getItem('vitthal_wishlist') || '[]');
    return wishlist.includes(productId);
}

// Load and display wishlist items
async function loadWishlist() {
    const rawWishlist = await getWishlist();
    const wishlistContent = document.getElementById('wishlistContent');

    if (!wishlistContent) return;

    if (!rawWishlist || rawWishlist.length === 0) {
        wishlistContent.innerHTML = `
            <div class="empty-wishlist">
                <i class="bi bi-heart"></i>
                <h2>Your Wishlist is Empty</h2>
                <p>Start adding your favorite frames to your collection!</p>
                <a href="index.html">Continue Shopping</a>
            </div>
        `;
        return;
    }

    // Determine if we have objects or IDs
    const isObjectList = typeof rawWishlist[0] === 'object';
    const wishlistIds = isObjectList ? rawWishlist.map(p => p._id) : rawWishlist;

    try {
        // Fetch all products to get full details (essential for guest users, and good for syncing)
        const response = await fetch(`${API}/products`);
        if (!response.ok) throw new Error('Failed to load products');

        const allProducts = await response.json();
        // Store globally for cart addition later
        window.allProductsData = allProducts;

        // Filter all products to find those in our wishlist
        const wishlistProducts = allProducts.filter(product => wishlistIds.includes(product._id));

        if (wishlistProducts.length === 0 && !isObjectList) {
            wishlistContent.innerHTML = `
                <div class="empty-wishlist">
                    <i class="bi bi-heart"></i>
                    <h2>Your Wishlist is Empty</h2>
                    <p>Start adding your favorite frames to your collection!</p>
                    <a href="index.html">Continue Shopping</a>
                </div>
            `;
            return;
        }

        // If we have objects from API but they weren't found in allProducts (rare), use the API objects
        const finalDisplayProducts = wishlistProducts.length > 0 ? wishlistProducts : (isObjectList ? rawWishlist : []);

        let html = '<div class="wishlist-grid">';

        for (const product of finalDisplayProducts) {
            const rawImage = product.images && product.images[0] ? product.images[0] : 'assets/images/placeholder.png';
            const isS3 = (rawImage && rawImage.startsWith('http') && rawImage.includes('.s3.'));
            const imageUrl = isS3 ? `${API}/upload/proxy?url=${encodeURIComponent(rawImage)}` : rawImage;

            html += `
                <div class="T-product" data-product-id="${product._id}">
                    <div class="img-cover">
                        <div class="img-1" style="background-image: url('${imageUrl}');"></div>
                        <button class="fev-btn active liked" onclick="removeFromWishlist('${product._id}')">
                            <i class="bi bi-heart-fill" style="color: #fa873b;"></i>
                        </button>
                    </div>
                    <div class="Trending-product-details">
                        <h4>${product.name || 'Untitled Product'}</h4>
                        <div class="T-product-span">
                            <span id="span-name" style="color: #8a7560; font-size: 0.9rem;">${product.category || 'General'} Collection</span>
                            <span class="text-lg">₹${product.basePrice?.toLocaleString('en-IN') || '0'}</span>
                        </div>
                        <div style="margin-top: 15px; display: flex; gap: 10px;">
                            <button class="btn-add-to-cart" style="flex: 2; padding: 10px; font-size: 0.9rem;" onclick="addWishlistItemToCart('${product._id}')">
                                <i class="bi bi-cart"></i> Add to Cart
                            </button>
                            <button class="btn-remove" style="flex: 1; padding: 10px; font-size: 0.8rem;" onclick="removeFromWishlist('${product._id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        wishlistContent.innerHTML = html;
    } catch (error) {
        console.error('Error loading wishlist products:', error);
        wishlistContent.innerHTML = `
            <div class="empty-wishlist">
                <i class="bi bi-exclamation-triangle" style="color: #fa873b;"></i>
                <h2>Oops! Something went wrong</h2>
                <p>We couldn't load your wishlist. Please try again later.</p>
                <a href="index.html">Back to Home</a>
            </div>
        `;
    }
}

// Add item from wishlist to cart
function addWishlistItemToCart(productId) {
    const products = window.allProductsData || [];
    const product = products.find(p => p._id === productId);

    if (product) {
        let cart = JSON.parse(localStorage.getItem('vitthal_cart') || '[]');
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: product._id,
                name: product.name,
                price: product.basePrice,
                image: product.images[0] || 'assets/images/placeholder.png',
                quantity: 1
            });
        }

        localStorage.setItem('vitthal_cart', JSON.stringify(cart));
        showNotification('✓ Added to Cart!', 'success');

        // Update cart count if icon exists
        if (window.updateCartCount) window.updateCartCount();
    } else {
        showNotification('Product details not found', 'error');
    }
}

// Remove heart icon from products when item is in wishlist
async function updateWishlistHearts() {
    const rawWishlist = await getWishlist();
    if (!rawWishlist) return;

    rawWishlist.forEach(item => {
        const id = typeof item === 'object' ? item._id : item;
        const heartButtons = document.querySelectorAll(`[data-product-id="${id}"] .fev-btn, [data-product-id="${id}"] .heart-btn`);
        heartButtons.forEach(btn => {
            btn.classList.add('active');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.remove('bi-heart');
                icon.classList.add('bi-heart-fill');
            }
        });
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        border-radius: 5px;
        z-index: 9999;
        animation: slideIn 0.3s ease-in-out;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add styles for notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
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
document.head.appendChild(style);

// Expose functions globally
window.getWishlist = getWishlist;
window.addToWishlist = addToWishlist;
window.removeFromWishlist = removeFromWishlist;
window.isInWishlist = isInWishlist;
window.loadWishlist = loadWishlist;

// Background Sync for logged in users
async function syncWishlist() {
    const token = getToken();
    if (token) {
        const rawWishlist = await getWishlist();
        if (Array.isArray(rawWishlist)) {
            const wishlistIds = rawWishlist.map(item => typeof item === 'object' ? item._id : item);
            localStorage.setItem('vitthal_wishlist', JSON.stringify(wishlistIds));
        }
    }
}

// Load wishlist on page load
document.addEventListener('DOMContentLoaded', async () => {
    await syncWishlist(); // Sync first for logged in users
    await loadWishlist();
    await updateWishlistHearts();
});
