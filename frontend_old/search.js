// Product Search & Filtering System

class ProductSearchFilter {
    constructor() {
        this.allProducts = [];
        this.filteredProducts = [];
        this.filters = {
            search: '',
            category: '',
            minPrice: 0,
            maxPrice: Infinity,
            sortBy: 'relevance'
        };
        this.loadProducts();
    }

    // Load all products from the page or API
    loadProducts() {
        // Get products from page
        const productCards = document.querySelectorAll('.T-product');

        productCards.forEach((card, index) => {
            const name = card.querySelector('h4')?.innerText || 'Product ' + (index + 1);
            const priceText = card.querySelector('.text-lg')?.innerText || '0';
            const price = this.parsePrice(priceText);
            const bgImage = card.querySelector('.img-1')?.style.backgroundImage;
            const imageUrl = bgImage ? bgImage.slice(5, -2) : '';

            // Determine category from page
            const pageTitle = document.title.toLowerCase();
            let category = 'other';
            if (pageTitle.includes('god')) category = 'god';
            else if (pageTitle.includes('warrior')) category = 'warriors';
            else if (pageTitle.includes('custom')) category = 'custom';
            else if (pageTitle.includes('new')) category = 'new';

            this.allProducts.push({
                id: 'prod_' + index + '_' + Date.now(),
                name: name,
                price: price,
                image: imageUrl,
                category: category,
                element: card
            });
        });

        this.filteredProducts = [...this.allProducts];
    }

    // Parse price from text
    parsePrice(text) {
        const match = text.match(/[\d,]+/);
        return match ? parseInt(match[0].replace(/,/g, '')) : 0;
    }

    // Apply all filters
    applyFilters() {
        this.filteredProducts = this.allProducts.filter(product => {
            // Search filter
            const matchSearch = product.name.toLowerCase().includes(this.filters.search.toLowerCase());

            // Category filter
            const matchCategory = !this.filters.category || product.category === this.filters.category;

            // Price filter
            const matchPrice = product.price >= this.filters.minPrice && product.price <= this.filters.maxPrice;

            return matchSearch && matchCategory && matchPrice;
        });

        // Sort
        this.sortProducts();
        this.updateUI();
    }

    // Sort products
    sortProducts() {
        switch (this.filters.sortBy) {
            case 'price-low':
                this.filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                this.filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'newest':
                this.filteredProducts.sort((a, b) => b.id.localeCompare(a.id));
                break;
            default:
                // relevance - keep original order
                break;
        }
    }

    // Update UI visibility
    updateUI() {
        // Hide all products first
        this.allProducts.forEach(product => {
            product.element.style.display = 'none';
        });

        // Show filtered products
        this.filteredProducts.forEach(product => {
            product.element.style.display = '';
        });

        // Update results count
        this.updateResultsCount();
    }

    // Update results count
    updateResultsCount() {
        const resultCount = document.getElementById('results-count');
        if (resultCount) {
            resultCount.textContent = `${this.filteredProducts.length} products found`;
        }
    }

    // Update filters
    setFilter(filterName, value) {
        this.filters[filterName] = value;
        this.applyFilters();
    }

    // Reset filters
    resetFilters() {
        this.filters = {
            search: '',
            category: '',
            minPrice: 0,
            maxPrice: Infinity,
            sortBy: 'relevance'
        };
        this.applyFilters();
    }
}

// Global instance
let searchFilter = null;

// Create search and filter UI
function createSearchFilterUI() {
    const container = document.querySelector('.products-container') ||
        document.querySelector('.trending-products') ||
        document.body;

    if (!container || document.getElementById('search-filter-panel')) return;

    const filterPanel = document.createElement('div');
    filterPanel.id = 'search-filter-panel';
    filterPanel.innerHTML = `
        <div style="background: white; padding: 20px; margin-bottom: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; align-items: end;">
                
                <!-- Search Input -->
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Search</label>
                    <input type="text" id="search-input" placeholder="Search products..." 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                </div>

                <!-- Category Filter -->
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Category</label>
                    <select id="category-filter" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                        <option value="">All Categories</option>
                        <option value="god">God Frames</option>
                        <option value="warriors">Warrior Frames</option>
                        <option value="custom">Custom Frames</option>
                        <option value="new">New Arrivals</option>
                    </select>
                </div>

                <!-- Price Range -->
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Max Price</label>
                    <input type="number" id="price-filter" placeholder="Max price" min="0"
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                </div>

                <!-- Sort -->
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Sort By</label>
                    <select id="sort-filter" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                        <option value="relevance">Relevance</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="name">Name: A to Z</option>
                        <option value="newest">Newest First</option>
                    </select>
                </div>

                <!-- Reset Button -->
                <div style="display: flex; gap: 10px;">
                    <button id="reset-filters" style="flex: 1; padding: 10px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 5px; cursor: pointer; font-weight: 600; transition: all 0.3s;">
                        Reset
                    </button>
                </div>
            </div>

            <!-- Results Count -->
            <div style="margin-top: 15px; color: #666; font-size: 14px;">
                <span id="results-count">0 products found</span>
            </div>
        </div>
    `;

    // Insert before products container
    const firstProduct = document.querySelector('.T-product');
    if (firstProduct && firstProduct.parentElement) {
        firstProduct.parentElement.insertBefore(filterPanel, firstProduct);
    } else {
        container.insertBefore(filterPanel, container.firstChild);
    }

    // Initialize search filter
    searchFilter = new ProductSearchFilter();
    searchFilter.updateUI();

    // Event listeners
    document.getElementById('search-input').addEventListener('input', (e) => {
        searchFilter.setFilter('search', e.target.value);
    });

    document.getElementById('category-filter').addEventListener('change', (e) => {
        searchFilter.setFilter('category', e.target.value);
    });

    document.getElementById('price-filter').addEventListener('input', (e) => {
        const maxPrice = e.target.value ? parseInt(e.target.value) : Infinity;
        searchFilter.setFilter('maxPrice', maxPrice);
    });

    document.getElementById('sort-filter').addEventListener('change', (e) => {
        searchFilter.setFilter('sortBy', e.target.value);
    });

    document.getElementById('reset-filters').addEventListener('click', () => {
        searchFilter.resetFilters();
        document.getElementById('search-input').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('price-filter').value = '';
        document.getElementById('sort-filter').value = 'relevance';
    });
}

// Initialize on page load
// document.addEventListener('DOMContentLoaded', () => {
//     // Wait a bit for products to load
//     setTimeout(createSearchFilterUI, 500);
// });

// Also trigger when products are dynamically loaded
// const observer = new MutationObserver(() => {
//     if (!searchFilter && document.querySelector('.T-product')) {
//         createSearchFilterUI();
//     }
// });

// observer.observe(document.body, { childList: true, subtree: true });
