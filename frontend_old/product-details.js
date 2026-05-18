// Product Details Page Script
const API_URL = window.API_URL || '/api';

class ProductDetailsPage {
    constructor() {
        this.product = null;
        this.init();
    }

    init() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (productId) {
            this.loadProduct(productId);
        } else {
            this.showError('Product not found');
        }

        this.setupEventListeners();
    }

    async loadProduct(productId) {
        try {
            const response = await fetch(`${API_URL}/products/${productId}`);
            if (!response.ok) throw new Error('Product not found');

            this.product = await response.json();
            this.renderProductDetails();
            this.loadReviews();
        } catch (error) {
            console.error('Error loading product:', error);
            this.showError('Product not found or failed to load');
        }
    }

    normalizeImageUrl(url) {
        if (!url) return 'assets/images/placeholder.png';
        if (url.startsWith('http') && url.includes('.s3.')) {
            return `${API_URL}/upload/proxy?url=${encodeURIComponent(url)}`;
        }
        return url;
    }

    formatSizeName(size) {
        if (!size) return '';
        const s = size.toLowerCase();
        if (s.includes('inch') || s.includes('feet') || s.includes('ft')) return size;

        // Match standard feet sizes
        const feetSizes = ['2x4', '3x6', '4x8', '2 x 4', '3 x 6', '4 x 8'];
        if (feetSizes.includes(size.trim())) return `${size} feet`;

        return `${size} inches`;
    }

    renderProductDetails() {
        if (!this.product) return;

        // Update page title
        document.title = `${this.product.name} - Vitthal Photo Frames`;

        // Update breadcrumbs
        const breadcrumbs = document.querySelector('.breadcrumbs');
        if (breadcrumbs) {
            const categoryLink = this.getCategoryLink(this.product.category);
            breadcrumbs.innerHTML = `<a href="index.html">Home ></a> <a href="${categoryLink}">${this.product.category} ></a> ${this.product.name}`;
        }

        // Update main image
        const mainImg = document.getElementById('main-product-img');
        if (mainImg && this.product.images && this.product.images[0]) {
            mainImg.src = this.normalizeImageUrl(this.product.images[0]);
            mainImg.alt = this.product.name;
        }

        // Update thumbnail images
        const thumbnailList = document.querySelector('.thumbnail-list');
        if (thumbnailList && this.product.images) {
            thumbnailList.innerHTML = this.product.images.map((img, index) =>
                `<img src="${this.normalizeImageUrl(img)}" ${index === 0 ? 'class="active"' : ''} onclick="changeImage(this)">`
            ).join('');
        }

        // Update product info
        const titleElement = document.querySelector('.product-title');
        if (titleElement) {
            titleElement.textContent = this.product.name;
        }

        const priceElement = document.querySelector('.product-price');
        if (priceElement) {
            let initialPrice = this.product.basePrice;
            if (this.product.variants && this.product.variants.sizes && this.product.variants.sizes.length > 0) {
                initialPrice += this.product.variants.sizes[0].priceModifier;
            }
            priceElement.innerHTML = `₹${initialPrice.toLocaleString()}`;
        }

        const descriptionElement = document.querySelector('.product-description');
        if (descriptionElement) {
            descriptionElement.textContent = this.product.description;
        }

        // Update size options
        const sizeSelect = document.querySelector('.size-select');
        if (sizeSelect && this.product.variants && this.product.variants.sizes) {
            sizeSelect.innerHTML = this.product.variants.sizes.map(size =>
                `<option value="${size.size}"> ${this.formatSizeName(size.size)} (₹${(this.product.basePrice + size.priceModifier).toLocaleString()})</option>`
            ).join('');
        }

        // Update action buttons
        this.setupActionButtons();
    }

    setupActionButtons() {
        const addToCartBtn = document.querySelector('.add-cart-btn');
        const buyNowBtn = document.querySelector('.buy-now-btn');

        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => this.addToCart());
        }

        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', () => this.buyNow());
        }
    }

    addToCart() {
        if (!this.product) return;

        const sizeSelect = document.querySelector('.size-select');
        const selectedSize = sizeSelect ? sizeSelect.value : 'default';

        let cart = JSON.parse(localStorage.getItem('vitthal_cart') || '[]');
        const existingItem = cart.find(item => item.id === this.product._id && item.size === selectedSize);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            // Find price for the selected size
            let finalPrice = this.product.basePrice;
            if (this.product.variants && this.product.variants.sizes) {
                const sizeVariant = this.product.variants.sizes.find(s => s.size === selectedSize);
                if (sizeVariant) {
                    finalPrice += sizeVariant.priceModifier;
                }
            }

            cart.push({
                id: this.product._id,
                name: this.product.name,
                price: finalPrice,
                image: this.product.images[0] || 'assets/images/placeholder.png',
                size: selectedSize,
                quantity: 1
            });
        }

        localStorage.setItem('vitthal_cart', JSON.stringify(cart));
        this.showToast('Added to cart');
        this.updateCartCount();
    }

    buyNow() {
        this.addToCart();
        window.location.href = 'checkout.html';
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

    async loadReviews() {
        if (!this.product) return;

        try {
            // Using the global reviewSystem from reviews.js
            const reviews = await reviewSystem.getReviews(this.product._id);
            const avgRating = reviewSystem.getAverageRating(reviews);
            const count = reviews.length;

            const ratingStars = document.querySelector('.product-rating .stars');
            const reviewsCount = document.querySelector('.product-rating .reviews-count');

            if (ratingStars) {
                // Reuse renderStars from reviews.js if available, otherwise simple star string
                ratingStars.innerHTML = typeof renderStars === 'function' ? renderStars(avgRating) : '★'.repeat(Math.round(avgRating));
            }

            if (reviewsCount) {
                reviewsCount.textContent = `(${count} ${count === 1 ? 'Review' : 'Reviews'})`;
            }
        } catch (error) {
            console.error('Error loading reviews for summary:', error);
        }
    }

    getCategoryLink(category) {
        switch (category) {
            case 'God': return 'god.html';
            case 'Warriors': return 'warriors.html';
            case 'Custom': return 'custome_frame.html';
            case 'New': return 'new.html';
            default: return 'index.html';
        }
    }

    setupEventListeners() {
        // Size change handler
        const sizeSelect = document.querySelector('.size-select');
        if (sizeSelect) {
            sizeSelect.addEventListener('change', (e) => {
                const selectedOption = e.target.selectedOptions[0];
                const priceText = selectedOption.textContent;
                const priceMatch = priceText.match(/\(₹([\d,]+)\)/);
                if (priceMatch) {
                    const priceElement = document.querySelector('.product-price');
                    if (priceElement) {
                        priceElement.innerHTML = `₹${priceMatch[1]}`;
                    }
                }
            });
        }
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

    showError(message) {
        const container = document.querySelector('.product-details-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: #dc3545;">
                    <i class="bi bi-exclamation-triangle" style="font-size: 4rem; margin-bottom: 20px;"></i>
                    <h2>Product Not Found</h2>
                    <p>${message}</p>
                    <a href="index.html" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #fa873b; color: white; text-decoration: none; border-radius: 5px;">Back to Home</a>
                </div>
            `;
        }
    }
}

// Image change function for gallery
function changeImage(img) {
    const mainImg = document.getElementById('main-product-img');
    const thumbnails = document.querySelectorAll('.thumbnail-list img');

    if (mainImg && img) {
        mainImg.src = img.src;
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        img.classList.add('active');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ProductDetailsPage();
});
