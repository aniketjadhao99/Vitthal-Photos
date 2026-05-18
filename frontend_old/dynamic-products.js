// Dynamic Product Loading System
const API_URL = window.API_URL || '/api';

class DynamicProductLoader {
    constructor() {

        this.products = [];
        this.filteredProducts = [];
        this.currentCategory = this.getCurrentCategory();
        this.productGrid = document.getElementById('product-grid');
        this.searchPanel = document.getElementById('search-panel');
        this.init();
    }

    getCurrentCategory() {
        const pageTitle = document.title.toLowerCase();


        if (pageTitle.includes('god')) {

            return 'God';
        }
        if (pageTitle.includes('warrior')) {

            return 'Warriors';
        }
        if (pageTitle.includes('custom')) {

            return 'Custom';
        }
        if (pageTitle.includes('new')) {

            return 'New';
        }

        return 'all';
    }

    async init() {
        await this.loadProducts();
        this.setupSearchPanel();

        // Handle URL search parameter
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        if (searchQuery) {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = searchQuery;
                this.filterProducts();
            }
        } else {
            this.renderProducts();
        }
    }

    async loadProducts() {
        try {
            const response = await fetch(`${API_URL}/products`);
            if (!response.ok) throw new Error('Failed to load products');
            this.products = await response.json();

            if (this.currentCategory === 'New') {
                // Special logic for New page: sort by upload date
                // Products within 5 days shown first, then others
                const now = new Date();
                const fiveDaysAgo = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000));

                this.filteredProducts = [...this.products].sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0);
                    const dateB = new Date(b.createdAt || 0);

                    const isNewA = dateA >= fiveDaysAgo;
                    const isNewB = dateB >= fiveDaysAgo;

                    if (isNewA && !isNewB) return -1;
                    if (!isNewA && isNewB) return 1;

                    return dateB - dateA; // Both or neither are within 5 days, show newest first
                });
            } else {
                this.filteredProducts = this.currentCategory === 'all'
                    ? this.products
                    : this.products.filter(p => p.category === this.currentCategory);
            }

        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products. Please try again later.');
        }
    }

    setupSearchPanel() {
        if (!this.searchPanel) return;

        this.searchPanel.innerHTML = `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; align-items: center;">
                    <div>
                        <input type="text" id="search-input" placeholder="Search products..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    <div>
                        <select id="category-filter" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            <option value="">All Categories</option>
                            <option value="God">God</option>
                            <option value="Warriors">Warriors</option>
                            <option value="Custom">Custom</option>
                            <option value="New">New</option>
                        </select>
                    </div>
                    <div>
                        <select id="sort-filter" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            <option value="name">Name A-Z</option>
                            <option value="name-desc">Name Z-A</option>
                            <option value="price">Price Low-High</option>
                            <option value="price-desc">Price High-Low</option>
                        </select>
                    </div>
                    <div>
                        <button id="reset-filters" style="width: 100%; padding: 10px; background: #fa873b; color: white; border: none; border-radius: 5px; cursor: pointer;">Reset</button>
                    </div>
                    <div>
                        <button id="refresh-products" style="width: 100%; padding: 10px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">Refresh</button>
                    </div>
                </div>
                <div id="results-count" style="margin-top: 10px; color: #666;"></div>
            </div>
        `;

        // Set initial category filter
        const categoryFilter = document.getElementById('category-filter');
        if (this.currentCategory !== 'all') {
            categoryFilter.value = this.currentCategory;
        }

        // Add event listeners
        document.getElementById('search-input').addEventListener('input', () => this.filterProducts());
        document.getElementById('category-filter').addEventListener('change', () => this.filterProducts());
        document.getElementById('sort-filter').addEventListener('change', () => this.filterProducts());
        document.getElementById('reset-filters').addEventListener('click', () => this.resetFilters());
        document.getElementById('refresh-products').addEventListener('click', () => this.refreshProducts());
    }

    filterProducts() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        const sortFilter = document.getElementById('sort-filter').value;

        // Redirection logic for special pages and category navigation
        if (categoryFilter) {
            const pageMap = {
                'God': 'god.html',
                'Warriors': 'warriors.html',
                'Custom': 'custome_frame.html',
                'New': 'new.html'
            };

            const targetPage = pageMap[categoryFilter];
            if (targetPage && !window.location.pathname.includes(targetPage)) {
                window.location.href = targetPage;
                return;
            }
        }

        let filtered = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || product.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });

        // Sort products
        filtered.sort((a, b) => {
            const getPrice = (p) => {
                if (p.basePrice > 0) return p.basePrice;
                if (p.variants && p.variants.sizes && p.variants.sizes.length > 0) return p.variants.sizes[0].priceModifier;
                return 0;
            };

            switch (sortFilter) {
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'price':
                    return getPrice(a) - getPrice(b);
                case 'price-desc':
                    return getPrice(b) - getPrice(a);
                default: // name
                    return a.name.localeCompare(b.name);
            }
        });

        this.filteredProducts = filtered;
        this.updateResultsCount();
        this.renderProducts();
    }

    resetFilters() {
        document.getElementById('search-input').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('sort-filter').value = 'name';
        this.filteredProducts = this.currentCategory === 'all'
            ? this.products
            : this.products.filter(p => p.category === this.currentCategory);
        this.updateResultsCount();
        this.renderProducts();
    }

    updateResultsCount() {
        const countElement = document.getElementById('results-count');
        if (countElement) {
            countElement.textContent = `Showing ${this.filteredProducts.length} of ${this.products.length} products`;
        }
    }

    renderProducts() {
        if (!this.productGrid) return;

        if (this.filteredProducts.length === 0) {
            this.productGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">
                    <i class="bi bi-search" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <h3>No products found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }

        this.productGrid.innerHTML = this.filteredProducts.map(product => this.createProductCard(product)).join('');
        this.attachProductEventListeners();
    }

    createProductCard(product) {
        const rawImage = product.images && product.images[0] ? product.images[0] : 'assets/images/placeholder.png';
        const isS3 = (rawImage && rawImage.startsWith('http') && rawImage.includes('.s3.'));
        const imageUrl = isS3 ? `${API_URL}/upload/proxy?url=${encodeURIComponent(rawImage)}` : rawImage;
        const isWishlisted = this.isInWishlist(product._id);

        // Check if product is new (added within last 5 days)
        const now = new Date();
        const fiveDaysAgo = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000));
        const createdAt = new Date(product.createdAt || 0);
        const isNew = createdAt >= fiveDaysAgo;

        let displayPrice = product.basePrice || 0;
        if (displayPrice === 0 && product.variants && product.variants.sizes && product.variants.sizes.length > 0) {
            displayPrice = product.variants.sizes[0].priceModifier;
        }

        return `
            <div class="T-product" data-product-id="${product._id}" data-raw-image="${rawImage}">
                <div class="img-cover">
                    <div class="img-1" style="background-image: url('${imageUrl}');"></div>
                    ${isNew ? '<span class="new-badge" style="position: absolute; top: 10px; left: 10px; background: #fa873b; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; z-index: 5;">NEW</span>' : ''}
                    <button class="fev-btn ${isWishlisted ? 'active' : ''}" data-product-id="${product._id}">
                        <i class="bi bi-heart${isWishlisted ? '-fill' : ''}"></i>
                    </button>
                    <div class="cart-btn">
                        <button class="Add-to-cart" data-product-id="${product._id}"><i class="bi bi-cart"></i> Add to Cart</button>
                    </div>
                </div>
                <div class="Trending-product-details">
                    <h4>${product.name}</h4>
                    <div class="T-product-span">
                        <span class="text-[#8a7560] text-sm">${product.category}</span>
                        <span class="text-lg font-semibold">₹${displayPrice.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;
    }

    attachProductEventListeners() {
        // We now let the global addWishlistButtons() in app.js handle heart listeners
        // to avoid duplicate event firing and state confusion.
        if (window.addWishlistButtons) {
            window.addWishlistButtons();
        }

        // Add to cart buttons
        document.querySelectorAll('.Add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.productId;
                this.addToCart(productId);
            });
        });

        // Product click to view details
        document.querySelectorAll('.T-product').forEach(card => {
            card.addEventListener('click', () => {
                const productId = card.dataset.productId;
                window.location.href = `product-details.html?id=${productId}`;
            });
        });
    }



    isInWishlist(productId) {
        // Prefer the unified key used in wishlist.js and app.js
        const wishlist = JSON.parse(localStorage.getItem('vitthal_wishlist') || '[]');
        return wishlist.includes(productId);
    }

    async toggleWishlist(productId) {
        // Check if global wishlist functions from wishlist.js are available
        if (window.addToWishlist && window.removeFromWishlist && window.isInWishlist) {
            const isCurrentlyIn = await window.isInWishlist(productId);
            if (isCurrentlyIn) {
                await window.removeFromWishlist(productId);
                this.showToast('Removed from wishlist');
            } else {
                const product = this.products.find(p => p._id === productId);
                const added = await window.addToWishlist(product || { _id: productId });
                if (added) this.showToast('Added to wishlist');
            }
            return;
        }

        // Fallback to localStorage only logic
        let wishlist = JSON.parse(localStorage.getItem('vitthal_wishlist') || '[]');
        const index = wishlist.indexOf(productId);

        if (index > -1) {
            wishlist.splice(index, 1);
        } else {
            wishlist.push(productId);
        }

        localStorage.setItem('vitthal_wishlist', JSON.stringify(wishlist));
        this.showToast(index > -1 ? 'Removed from wishlist' : 'Added to wishlist');
    }

    addToCart(productId) {
        const product = this.products.find(p => p._id === productId);
        if (!product) return;

        let cart = JSON.parse(localStorage.getItem('vitthal_cart') || '[]');
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            let finalPrice = product.basePrice || 0;
            let finalSize = '5 x 7 inches'; // Default starting size

            if (finalPrice === 0 && product.variants && product.variants.sizes && product.variants.sizes.length > 0) {
                finalPrice = product.variants.sizes[0].priceModifier;
                finalSize = product.variants.sizes[0].size;
            }

            cart.push({
                id: product._id,
                name: product.name,
                price: finalPrice,
                image: product.images[0] || 'assets/images/placeholder.png',
                size: finalSize,
                quantity: 1
            });
        }

        localStorage.setItem('vitthal_cart', JSON.stringify(cart));
        this.showToast('Added to cart');
        this.updateCartCount();
    }

    updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('vitthal_cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
            cartCountElement.style.display = totalItems > 0 ? 'block' : 'none';
        }
    }

    async refreshProducts() {

        const refreshBtn = document.getElementById('refresh-products');
        if (refreshBtn) {
            refreshBtn.textContent = 'Loading...';
            refreshBtn.disabled = true;
        }

        await this.loadProducts();
        this.renderProducts();

        if (refreshBtn) {
            refreshBtn.textContent = 'Refresh';
            refreshBtn.disabled = false;
        }

        this.showToast('Products refreshed!');
    }

    showToast(message, type = 'success') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fa873b;
                color: white;
                padding: 12px 20px;
                border-radius: 5px;
                z-index: 1000;
                font-size: 14px;
            `;
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.productLoader = new DynamicProductLoader();
});
