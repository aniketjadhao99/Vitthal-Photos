const API_URL = 'http://localhost:5000/api';

// Simplified admin access (No Login)
function checkAdminAccess() {
    return true;
}

function initAdmin() {
    loadDashboardStats();
    loadProducts();
    loadOrders();
    setupFormHandlers();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
} else {
    initAdmin();
}

function switchSection(sectionName, el) {
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));

    const targetSection = document.getElementById(sectionName);
    if (targetSection) targetSection.classList.add('active');

    if (el && el.classList) {
        el.classList.add('active');
    } else {
        const menuItem = document.querySelector(`.sidebar-menu .menu-item[onclick*="${sectionName}"]`);
        if (menuItem) menuItem.classList.add('active');
    }

    const titles = {
        'dashboard': 'Dashboard',
        'products': 'Products Management',
        'orders': 'Orders Management'
    };
    if (titles[sectionName]) {
        document.querySelector('.top-bar h1').textContent = titles[sectionName];
    }
}

let cachedOrders = [];
let cachedProducts = [];

function normalizeImageUrl(url) {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http') && trimmed.includes('.s3.')) {
        return `/api/upload/proxy?url=${encodeURIComponent(trimmed)}`;
    }
    return trimmed;
}

async function loadDashboardStats() {
    try {
        const ordersRes = await fetch(`${API_URL}/orders`);
        cachedOrders = await ordersRes.json();

        const productsRes = await fetch(`${API_URL}/products`);
        cachedProducts = await productsRes.json();

        document.getElementById('total-orders').textContent = cachedOrders.length;
        document.getElementById('total-products').textContent = cachedProducts.length;

        const totalRevenue = cachedOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        document.getElementById('total-revenue').textContent = `₹${totalRevenue.toLocaleString()}`;

        renderRecentOrders();
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function renderRecentOrders() {
    const list = document.getElementById('recent-orders-list');
    if (!list) return;
    list.innerHTML = cachedOrders.slice(0, 5).map(order => `
        <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <p style="margin:0; font-weight: bold;">${order.customerName}</p>
                <p style="margin:0; font-size: 12px; color: #666;">${new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <span style="font-weight: bold;">₹${order.totalPrice}</span>
        </div>
    `).join('') || '<p style="text-align:center;color:#999;">No recent orders</p>';
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = products.map(product => {
            const imgSrc = product.images && product.images[0] ? normalizeImageUrl(product.images[0]) : '';
            return `
            <tr>
                <td><img src="${imgSrc}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;"></td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>₹${product.basePrice}</td>
                <td>${product.stock}</td>
                <td>
                    <button onclick="deleteProduct('${product._id}')" style="background:#ff4757; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button>
                </td>
            </tr>
        `}).join('');
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function loadOrders() {
    try {
        const response = await fetch(`${API_URL}/orders`);
        const orders = await response.json();
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order._id.substring(0, 8)}</td>
                <td>${order.customerName}</td>
                <td>₹${order.totalPrice}</td>
                <td>${order.status || 'Pending'}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                    <button onclick="viewOrder('${order._id}')" style="background:#fa873b; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">View</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        fetch(`${API_URL}/products/${id}`, { method: 'DELETE' })
            .then(() => loadProducts());
    }
}

function viewOrder(id) {
    const order = cachedOrders.find(o => o._id === id);
    if (order) {
        alert(`Order for ${order.customerName}\nTotal: ₹${order.totalPrice}\nAddress: ${order.address}`);
    }
}

function setupFormHandlers() {
    const productForm = document.getElementById('addProductForm');
    if (productForm) {
        productForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(productForm);
            try {
                const res = await fetch(`${API_URL}/products`, {
                    method: 'POST',
                    body: formData
                });
                if (res.ok) {
                    alert('Product added!');
                    productForm.reset();
                    loadProducts();
                }
            } catch (err) {
                alert('Failed to add product');
            }
        };
    }
}
