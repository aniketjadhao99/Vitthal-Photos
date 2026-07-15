import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import JsBarcode from 'jsbarcode';

const API = '/api';

// Barcode component that renders an SVG barcode from a value
const Barcode = ({ value, width = 1.5, height = 40, fontSize = 12, displayValue = true }) => {
  const svgRef = useRef(null);
  useEffect(() => {
    if (svgRef.current && value) {
      try {
        // Use last 8 chars of ID to create a clean barcode code
        const code = value.slice(-8).toUpperCase();
        JsBarcode(svgRef.current, code, {
          format: 'CODE128',
          width,
          height,
          fontSize,
          displayValue,
          margin: 4,
          background: 'transparent',
        });
      } catch (e) {
        console.error('Barcode error:', e);
      }
    }
  }, [value, width, height, fontSize, displayValue]);
  return <svg ref={svgRef} />;
};

const TABS = ['dashboard', 'products', 'orders', 'users', 'reviews', 'coupons', 'returns', 'frameStyles', 'settings'];

const badge = (status = '') => {
  const s = status.toLowerCase();
  const map = {
    pending:    { bg: '#fff3cd', color: '#856404' },
    processing: { bg: '#d1ecf1', color: '#0c5460' },
    shipped:    { bg: '#cce5ff', color: '#004085' },
    delivered:  { bg: '#d4edda', color: '#155724' },
    cancelled:  { bg: '#f8d7da', color: '#721c24' },
  };
  const style = map[s] || { bg: '#eee', color: '#333' };
  return (
    <span style={{ background: style.bg, color: style.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
      {status}
    </span>
  );
};

const th = { padding: '12px', borderBottom: '2px solid #eee', whiteSpace: 'nowrap', background: '#f9f9f9', textAlign: 'left' };
const td = { padding: '12px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
const btn = (bg) => ({
  background: bg, color: 'white', border: 'none',
  padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
  marginRight: '6px', fontWeight: 600
});

const downloadImageFile = async (imageUrl, fileName = 'custom-frame-image.png') => {
  if (!imageUrl) return;
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Image download failed:', error);
    alert('Unable to download the selected image.');
  }
};

const emptyProduct = { name: '', description: '', basePrice: '', category: 'God', stock: '', sku: '', images: [''] };

export default function AdminPanel() {
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [products, setProducts]   = useState([]);
  const [orders, setOrders]       = useState([]);
  const [users, setUsers]         = useState([]);
  const [reviews, setReviews]     = useState([]);
  const [coupons, setCoupons]     = useState([]);
  const [returns, setReturns]     = useState([]);
  const [frameStyles, setFrameStyles] = useState([
    { id: 'modern', name: 'Modern', description: 'Clean & Minimalist', borderColor: '#d4af37', borderWidth: 8 },
    { id: 'ornate', name: 'Ornate', description: 'Elegant & Decorative', borderColor: '#b8860b', borderWidth: 12 },
    { id: 'vintage', name: 'Vintage', description: 'Classic & Timeless', borderColor: '#8b7355', borderWidth: 10 }
  ]);
  const [settings, setSettings]   = useState({ siteName: 'Vitthal Photo Frames', contactEmail: 'vitthalphotos99@gmail.com', contactPhone: '' });
  const [loading, setLoading]     = useState(false);
  
  // Frame Styles Management
  const [newFrameStyle, setNewFrameStyle] = useState({ name: '', description: '', borderColor: '#d4af37', borderWidth: 8 });
  const [editingFrameStyle, setEditingFrameStyle] = useState(null);

  // --- New features state ---
  // Search & Filter
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [userSearch, setUserSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('All');

  // Pagination
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const itemsPerPage = 8;
  const itemsPerPageLarge = 10;

  // Bulk selection
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [selectedReviews, setSelectedReviews] = useState(new Set());

  // Custom confirmation modal
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  // --- Memoized filtered and paginated lists ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p) return false;
      const name = p.name || '';
      const sku = p.sku || '';
      const id = p._id || '';
      const matchSearch = name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          sku.toLowerCase().includes(productSearch.toLowerCase()) ||
                          id.toLowerCase().includes(productSearch.toLowerCase());
      const matchCat = productCatFilter === 'All' || p.category === productCatFilter;
      return matchSearch && matchCat;
    });
  }, [products, productSearch, productCatFilter]);

  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, productPage]);
  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (!o) return false;
      const cName = o.customerName || '';
      const email = o.email || '';
      const id = o._id || '';
      const status = o.status || '';
      const matchSearch = cName.toLowerCase().includes(orderSearch.toLowerCase()) || 
                          email.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          id.toLowerCase().includes(orderSearch.toLowerCase());
      const matchStatus = orderStatusFilter === 'All' || status.toLowerCase() === orderStatusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const paginatedOrders = useMemo(() => {
    const start = (orderPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, orderPage]);
  const totalOrderPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (!u) return false;
      const name = u.name || '';
      const email = u.email || '';
      const id = u._id || '';
      return name.toLowerCase().includes(userSearch.toLowerCase()) || 
             email.toLowerCase().includes(userSearch.toLowerCase()) ||
             id.toLowerCase().includes(userSearch.toLowerCase());
    });
  }, [users, userSearch]);

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * itemsPerPageLarge;
    return filteredUsers.slice(start, start + itemsPerPageLarge);
  }, [filteredUsers, userPage]);
  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPageLarge);

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (!r) return false;
      const uName = r.userName || '';
      const comment = r.comment || '';
      const matchSearch = uName.toLowerCase().includes(reviewSearch.toLowerCase()) || 
                          comment.toLowerCase().includes(reviewSearch.toLowerCase());
      const matchRating = reviewRatingFilter === 'All' || r.rating === Number(reviewRatingFilter);
      return matchSearch && matchRating;
    });
  }, [reviews, reviewSearch, reviewRatingFilter]);

  const paginatedReviews = useMemo(() => {
    const start = (reviewPage - 1) * itemsPerPageLarge;
    return filteredReviews.slice(start, start + itemsPerPageLarge);
  }, [filteredReviews, reviewPage]);
  const totalReviewPages = Math.ceil(filteredReviews.length / itemsPerPageLarge);

  // Reset page numbers on filters change
  useEffect(() => { setProductPage(1); }, [productSearch, productCatFilter]);
  useEffect(() => { setOrderPage(1); }, [orderSearch, orderStatusFilter]);
  useEffect(() => { setUserPage(1); }, [userSearch]);
  useEffect(() => { setReviewPage(1); }, [reviewSearch, reviewRatingFilter]);

  // Bulk select toggles
  const toggleSelectProduct = (id) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllProducts = () => {
    setSelectedProducts(prev => {
      const allSelected = paginatedProducts.length > 0 && paginatedProducts.every(p => prev.has(p._id));
      const next = new Set(prev);
      if (allSelected) {
        paginatedProducts.forEach(p => next.delete(p._id));
      } else {
        paginatedProducts.forEach(p => next.add(p._id));
      }
      return next;
    });
  };

  const toggleSelectReview = (id) => {
    setSelectedReviews(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllReviews = () => {
    setSelectedReviews(prev => {
      const allSelected = paginatedReviews.length > 0 && paginatedReviews.every(r => prev.has(r._id));
      const next = new Set(prev);
      if (allSelected) {
        paginatedReviews.forEach(r => next.delete(r._id));
      } else {
        paginatedReviews.forEach(r => next.add(r._id));
      }
      return next;
    });
  };

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', discountValue: '', startsAt: '', expiresAt: '' });

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Barcode modal state
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [showAllBarcodes, setShowAllBarcodes] = useState(false);

  const navigate = useNavigate();
  const { addToast } = useToast();

  // Auth guard
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('vitthal_user') || 'null');
    // Check for both isAdmin and role for compatibility with old/new sessions
    if (!user || (!user.isAdmin && user.role !== 'admin')) {
      addToast('Admin access required', 'error');
      navigate('/login');
    }
  }, [navigate, addToast]);

  // Save frame styles to localStorage
  useEffect(() => {
    localStorage.setItem('vitthal_frameStyles', JSON.stringify(frameStyles));
  }, [frameStyles]);

  const token = localStorage.getItem('vitthal_token');
  const headers = useMemo(() => ({ 
    'Content-Type': 'application/json', 
    ...(token ? { Authorization: `Bearer ${token}` } : {}) 
  }), [token]);

  // --- Data loaders with error handling ---
  const loadProducts = useCallback(async () => {
    try {
      const r = await fetch(`${API}/products`);
      if (!r.ok) throw new Error(`HTTP ${r.status}: Products fetch failed`);
      const data = await r.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Load products error:', err);
      addToast('Failed to load products', 'error');
    }
  }, [addToast]);

  const loadOrders = useCallback(async () => {
    try {
      const r = await fetch(`${API}/orders`, { headers });
      if (!r.ok) throw new Error(`HTTP ${r.status}: Orders fetch failed`);
      const data = await r.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Load orders error:', err);
      addToast('Failed to load orders', 'error');
    }
  }, [headers, addToast]);

  const loadUsers = useCallback(async () => {
    try {
      const r = await fetch(`${API}/users`, { headers });
      if (!r.ok) throw new Error(`HTTP ${r.status}: Users fetch failed`);
      const data = await r.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Load users error:', err);
      addToast('Failed to load users', 'error');
    }
  }, [headers, addToast]);

  const loadReviews = useCallback(async () => {
    try {
      const r = await fetch(`${API}/reviews`, { headers });
      if (!r.ok) throw new Error(`HTTP ${r.status}: Reviews fetch failed`);
      const data = await r.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Load reviews error:', err);
      addToast('Failed to load reviews', 'error');
    }
  }, [headers, addToast]);

  const loadCoupons = useCallback(async () => {
    try {
      const r = await fetch(`${API}/coupons`, { headers });
      if (!r.ok) throw new Error(`HTTP ${r.status}: Coupons fetch failed`);
      const data = await r.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Load coupons error:', err);
    }
  }, [headers]);

  const loadReturns = useCallback(async () => {
    try {
      const r = await fetch(`${API}/returns/admin/all`, { headers });
      if (!r.ok) throw new Error(`HTTP ${r.status}: Returns fetch failed`);
      const data = await r.json();
      setReturns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Load returns error:', err);
    }
  }, [headers]);

  const loadSettings = useCallback(async () => {
    try {
      const r = await fetch(`${API}/settings`);
      if (!r.ok) throw new Error(`HTTP ${r.status}: Settings fetch failed`);
      const d = await r.json();
      setSettings(s => ({ ...s, ...(d || {}) }));
    } catch (err) {
      console.error('❌ Load settings error:', err);
      addToast('Failed to load settings', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (tab === 'dashboard') { 
          // Use independent calls so one failure doesn't stop others
          await loadProducts();
          try { await loadOrders(); } catch(e) {}
          try { await loadUsers(); } catch(e) {}
        }
        else if (tab === 'products') await loadProducts();
        else if (tab === 'orders') await loadOrders();
        else if (tab === 'users') await loadUsers();
        else if (tab === 'reviews') await loadReviews();
        else if (tab === 'coupons') await loadCoupons();
        else if (tab === 'returns') await loadReturns();
        else if (tab === 'frameStyles') { /* Frame styles already loaded in state */ }
        else if (tab === 'settings') await loadSettings();
      } catch (err) {
        console.error('❌ Fetch data error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tab, loadProducts, loadOrders, loadUsers, loadReviews, loadCoupons, loadReturns, loadSettings]);

  const [imageFile, setImageFile] = useState(null);

  // --- Actions ---
  const saveProduct = async () => {
    if (!editProduct.name || !editProduct.basePrice || !editProduct.category) {
      addToast('Name, Price and Category are required', 'error'); return;
    }

    setLoading(true);
    let finalImages = editProduct.images.filter(Boolean);

    // If a new file is selected, upload it first
    if (imageFile) {
      try {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await fetch(`${API}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalImages = [uploadData.imageUrl]; // Use the uploaded URL
        } else {
          addToast('Image upload failed', 'error');
          setLoading(false);
          return;
        }
      } catch (err) {
        addToast('Image upload error', 'error');
        setLoading(false);
        return;
      }
    }

    const payload = {
      ...editProduct,
      basePrice: Number(editProduct.basePrice),
      stock: Number(editProduct.stock) || 0,
      images: finalImages,
      variants: {
        sizes: [{ size: '12x15', priceModifier: 0 }],
        colors: [{ name: 'Standard', hexCode: '#FFD700' }]
      }
    };

    try {
      const url = editingId ? `${API}/products/${editingId}` : `${API}/products`;
      const r = await fetch(url, { 
        method: editingId ? 'PUT' : 'POST', 
        headers: { ...headers, 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      if (r.ok) { 
        addToast('Product saved!', 'success'); 
        setShowModal(false); 
        setImageFile(null);
        loadProducts();
        // Dispatch event to refresh category pages
        window.dispatchEvent(new Event('productsUpdated'));
      }
      else addToast('Save failed', 'error');
    } catch { addToast('Network error', 'error'); }
    finally { setLoading(false); }
  };

  const deleteItem = (type, id) => {
    setConfirmModal({
      show: true,
      title: `Delete this ${type}?`,
      message: `Are you sure you want to permanently delete this ${type}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const r = await fetch(`${API}/${type}s/${id}`, { method: 'DELETE', headers });
          if (r.ok) { 
            addToast(`${type} removed`, 'success'); 
            if (tab === 'products') loadProducts(); 
            else if (tab === 'orders') loadOrders(); 
            else if (tab === 'users') loadUsers();
            else if (tab === 'reviews') loadReviews();
            else if (tab === 'coupons') loadCoupons();
          }
          else addToast('Delete failed', 'error');
        } catch { addToast('Network error', 'error'); }
        finally { setConfirmModal({ show: false, title: '', message: '', onConfirm: null }); }
      }
    });
  };

  const deleteBulk = async (type) => {
    const ids = type === 'product' ? Array.from(selectedProducts) : Array.from(selectedReviews);
    if (ids.length === 0) return;
    
    setConfirmModal({
      show: true,
      title: `Delete Selected ${type}s?`,
      message: `Are you sure you want to permanently delete these ${ids.length} ${type}s? This action cannot be undone.`,
      onConfirm: async () => {
        setLoading(true);
        try {
          let count = 0;
          for (const id of ids) {
            const r = await fetch(`${API}/${type}s/${id}`, { method: 'DELETE', headers });
            if (r.ok) count++;
          }
          addToast(`Successfully deleted ${count} ${type}s`, 'success');
          if (type === 'product') {
            setSelectedProducts(new Set());
            loadProducts();
          } else if (type === 'review') {
            setSelectedReviews(new Set());
            loadReviews();
          }
        } catch (err) {
          addToast('Network error during bulk deletion', 'error');
        } finally {
          setLoading(false);
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  const updateOrderStatus = async () => {
    try {
      const r = await fetch(`${API}/orders/${selectedOrder._id}/status`, {
        method: 'PUT', headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (r.ok) { addToast('Status updated!', 'success'); setShowStatusModal(false); loadOrders(); }
    } catch { }
  };

  const handleSaveCoupon = async () => {
    try {
      const r = await fetch(`${API}/coupons`, {
        method: 'POST',
        headers,
        body: JSON.stringify(couponForm)
      });
      if (r.ok) {
        addToast('Coupon created', 'success');
        setShowCouponModal(false);
        loadCoupons();
      } else {
        const err = await r.json();
        addToast(err.message || 'Error creating coupon', 'error');
      }
    } catch { addToast('Network error', 'error'); }
  };

  const handleReturnStatus = async (id, status) => {
    try {
      const r = await fetch(`${API}/returns/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      });
      if (r.ok) {
        addToast(`Return ${status}`, 'success');
        loadReturns();
      }
    } catch { addToast('Network error', 'error'); }
  };

  // ===================== RENDER =====================
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      
      <style>{`
        .adm-sb { transform: translateX(-100%); }
        @media(min-width:992px) {
          .adm-sb { transform: translateX(0) !important; }
          .adm-main { margin-left: 240px !important; }
          .adm-tog { display:none !important; }
        }
        @media(max-width:991px) {
          .adm-sb-open { transform: translateX(0) !important; }
        }
      `}</style>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />}

      <div className={`adm-sb ${sidebarOpen ? 'adm-sb-open' : ''}`} style={{
        width: '240px', background: '#0f172a', color: 'white', position: 'fixed', inset: '0 auto 0 0', padding: '24px 16px', zIndex: 1000, transition: 'transform 0.3s'
      }}>
        <div style={{ color: '#fb923c', fontSize: '1.4rem', fontWeight: 900, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🖼️</span> Vitthal Admin
        </div>
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setSidebarOpen(false); }} style={{
            display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: '10px', marginBottom: '8px',
            background: tab === t ? '#fb923c' : 'transparent', color: tab === t ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer',
            fontSize: '0.95rem', textTransform: 'capitalize', fontWeight: 600
          }}>{t}</button>
        ))}
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={{ marginTop: 'auto', display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Logout</button>
      </div>

      <div className="adm-main" style={{ flex: 1, padding: '24px', boxSizing: 'border-box', minWidth: 0 }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="adm-tog" onClick={() => setSidebarOpen(true)} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>☰</button>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', textTransform: 'capitalize' }}>{tab}</h1>
          </div>
          <button onClick={() => navigate('/')} style={{ background: '#fb923c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(251,146,60,0.3)' }}>Visit Store</button>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading data...</div>}

        {!loading && tab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              {[
                { label: 'Total Products', val: products.length, icon: '📦', color: '#3b82f6' },
                { label: 'Active Orders', val: orders.filter(o => o.status.toLowerCase() !== 'delivered').length, icon: '🛒', color: '#f59e0b' },
                { label: 'Total Users', val: users.length, icon: '👥', color: '#10b981' },
                { label: 'Revenue', val: `₹${orders.reduce((a,o)=>a+(o.totalPrice||0),0).toLocaleString()}`, icon: '💰', color: '#8b5cf6' },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>{s.label}</span>
                    <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                  </div>
                  <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1e293b' }}>{s.val}</div>
                </div>
              ))}
            </div>
            
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px', overflowX: 'auto' }}>
              <h3 style={{ margin: '0 0 20px', color: '#1e293b' }}>Recent Activity</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['ID','Customer','Total','Status','Date'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {orders.slice(0,5).map(o => {
                    if (!o || !o._id) return null;
                    return (
                      <tr key={o._id}>
                        <td style={td}>#{String(o._id).slice(-6)}</td>
                        <td style={td}>{o.customerName || 'N/A'}</td>
                        <td style={td}>₹{o.totalPrice || 0}</td>
                        <td style={td}>{badge(o.status || 'Pending')}</td>
                        <td style={td}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {!loading && tab === 'products' && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ margin: 0 }}>All Products ({filteredProducts.length})</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {selectedProducts.size > 0 && (
                  <button onClick={() => deleteBulk('product')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                    🗑️ Delete Selected ({selectedProducts.size})
                  </button>
                )}
                <button onClick={() => setShowAllBarcodes(true)} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>🏷️ Print All Barcodes</button>
                <button onClick={() => { setEditProduct(emptyProduct); setEditingId(null); setShowModal(true); }} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>+ Add New</button>
              </div>
            </div>

            {/* Search & Category Filter Bar */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="🔍 Search products by name, ID, or SKU..." 
                value={productSearch} 
                onChange={e => setProductSearch(e.target.value)} 
                style={{ flex: 1, minWidth: '240px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
              />
              <select 
                value={productCatFilter} 
                onChange={e => setProductCatFilter(e.target.value)} 
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.9rem', minWidth: '160px' }}
              >
                <option value="All">All Categories</option>
                {['God', 'Warriors', 'New Arrivals', 'Custom'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...th, width: '40px' }}>
                      <input 
                        type="checkbox" 
                        checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProducts.has(p._id))}
                        onChange={toggleSelectAllProducts}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </th>
                    {['Product','Barcode','Category','Price','Stock','Actions'].map(h=><th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map(p => (
                    <tr key={p._id}>
                      <td style={td}>
                        <input 
                          type="checkbox" 
                          checked={selectedProducts.has(p._id)}
                          onChange={() => toggleSelectProduct(p._id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={td}><div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                        <img src={p.images?.[0]} style={{ width:40, height:40, objectFit:'cover', borderRadius:6 }} alt=""/>
                        <span>{p.name}</span>
                      </div></td>
                      <td style={{ ...td, cursor: 'pointer' }} onClick={() => { setBarcodeProduct(p); setShowBarcodeModal(true); }} title="Click to view & print barcode">
                        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '6px 10px', display: 'inline-block', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <Barcode value={p._id} width={1} height={28} fontSize={10} />
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#1e293b', marginTop: '2px', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                          <div style={{ fontSize: '9px', color: '#64748b' }}>₹{p.basePrice} • {p.category}</div>
                        </div>
                      </td>
                      <td style={td}>{p.category}</td>
                      <td style={td}>₹{p.basePrice}</td>
                      <td style={td}>{p.stock}</td>
                      <td style={td}>
                        <button onClick={() => { setBarcodeProduct(p); setShowBarcodeModal(true); }} style={btn('#6366f1')} title="View Barcode">Barcode</button>
                        <button onClick={() => { setEditProduct(p); setEditingId(p._id); setShowModal(true); }} style={btn('#3b82f6')}>Edit</button>
                        <button onClick={() => deleteItem('product', p._id)} style={btn('#ef4444')}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {paginatedProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ ...td, textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No products match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalProductPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                <button 
                  disabled={productPage === 1} 
                  onClick={() => setProductPage(prev => prev - 1)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: productPage === 1 ? '#f1f5f9' : 'white', cursor: productPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, color: '#475569' }}
                >
                  Prev
                </button>
                {Array.from({ length: totalProductPages }, (_, idx) => idx + 1).map(pNum => (
                  <button 
                    key={pNum} 
                    onClick={() => setProductPage(pNum)}
                    style={{ 
                      padding: '8px 14px', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0', 
                      background: productPage === pNum ? '#fb923c' : 'white', 
                      color: productPage === pNum ? 'white' : '#475569', 
                      cursor: 'pointer', 
                      fontWeight: 600 
                    }}
                  >
                    {pNum}
                  </button>
                ))}
                <button 
                  disabled={productPage === totalProductPages} 
                  onClick={() => setProductPage(prev => prev + 1)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: productPage === totalProductPages ? '#f1f5f9' : 'white', cursor: productPage === totalProductPages ? 'not-allowed' : 'pointer', fontWeight: 600, color: '#475569' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* ORDERS */}
        {!loading && tab === 'orders' && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>All Orders ({filteredOrders.length})</h3>

            {/* Search & Status Filter Bar */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="🔍 Search orders by customer name, email, or ID..." 
                value={orderSearch} 
                onChange={e => setOrderSearch(e.target.value)} 
                style={{ flex: 1, minWidth: '240px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
              />
              <select 
                value={orderStatusFilter} 
                onChange={e => setOrderStatusFilter(e.target.value)} 
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.9rem', minWidth: '160px' }}
              >
                <option value="All">All Statuses</option>
                {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Order ID','Products','Customer','Total','Status','Date','Actions'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {paginatedOrders.map(o => {
                    if (!o || !o._id) return null;
                    return (
                      <tr key={o._id}>
                        <td style={td}>#{String(o._id).slice(-8)}</td>
                        <td style={{...td, maxWidth: '250px'}}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {o.orderItems?.slice(0, 2).map((item, i) => {
                              if (!item) return null;
                              const itemName = item.name || '';
                              return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: '#f1f5f9', borderRadius: '6px', fontSize: '12px' }}>
                                  {item.product?.images?.[0] && <img src={item.product.images[0]} alt="" style={{ width: '24px', height: '24px', borderRadius: '3px', objectFit: 'cover' }} />}
                                  <span title={itemName}>{itemName.substring(0, 20)}{itemName.length > 20 ? '...' : ''}</span>
                                </div>
                              );
                            })}
                            {o.orderItems?.length > 2 && <span style={{ fontSize: '12px', color: '#64748b' }}>+{o.orderItems.length - 2} more</span>}
                          </div>
                        </td>
                        <td style={td}>{o.customerName || 'N/A'}</td>
                        <td style={td}>₹{o.totalPrice || 0}</td>
                        <td style={td}>{badge(o.status || 'Pending')}</td>
                        <td style={td}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td style={td}>
                          <button onClick={() => { setSelectedOrder(o); setShowOrderDetails(true); }} style={btn('#64748b')}>Details</button>
                          <button onClick={() => { setSelectedOrder(o); setNewStatus(o.status || 'Pending'); setShowStatusModal(true); }} style={btn('#fb923c')}>Status</button>
                          <button onClick={() => deleteItem('order', o._id)} style={btn('#ef4444')}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ ...td, textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No orders match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalOrderPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                <button 
                  disabled={orderPage === 1} 
                  onClick={() => setOrderPage(prev => prev - 1)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: orderPage === 1 ? '#f1f5f9' : 'white', cursor: orderPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, color: '#475569' }}
                >
                  Prev
                </button>
                {Array.from({ length: totalOrderPages }, (_, idx) => idx + 1).map(pNum => (
                  <button 
                    key={pNum} 
                    onClick={() => setOrderPage(pNum)}
                    style={{ 
                      padding: '8px 14px', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0', 
                      background: orderPage === pNum ? '#fb923c' : 'white', 
                      color: orderPage === pNum ? 'white' : '#475569', 
                      cursor: 'pointer', 
                      fontWeight: 600 
                    }}
                  >
                    {pNum}
                  </button>
                ))}
                <button 
                  disabled={orderPage === totalOrderPages} 
                  onClick={() => setOrderPage(prev => prev + 1)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: orderPage === totalOrderPages ? '#f1f5f9' : 'white', cursor: orderPage === totalOrderPages ? 'not-allowed' : 'pointer', fontWeight: 600, color: '#475569' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* USERS */}
        {!loading && tab === 'users' && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>All Users ({filteredUsers.length})</h3>

            {/* Search Bar */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder="🔍 Search users by name, email, or ID..." 
                value={userSearch} 
                onChange={e => setUserSearch(e.target.value)} 
                style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
              />
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Name','Email','Role','Actions'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {paginatedUsers.map(u => (
                  <tr key={u._id}><td style={td}>{u.name}</td><td style={td}>{u.email}</td><td style={td}>{badge(u.isAdmin ? 'admin' : 'user')}</td>
                  <td style={td}><button onClick={() => deleteItem('user', u._id)} style={btn('#ef4444')}>Delete</button></td></tr>
                ))}
                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ ...td, textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No users match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalUserPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                <button 
                  disabled={userPage === 1} 
                  onClick={() => setUserPage(prev => prev - 1)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: userPage === 1 ? '#f1f5f9' : 'white', cursor: userPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, color: '#475569' }}
                >
                  Prev
                </button>
                {Array.from({ length: totalUserPages }, (_, idx) => idx + 1).map(pNum => (
                  <button 
                    key={pNum} 
                    onClick={() => setUserPage(pNum)}
                    style={{ 
                      padding: '8px 14px', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0', 
                      background: userPage === pNum ? '#fb923c' : 'white', 
                      color: userPage === pNum ? 'white' : '#475569', 
                      cursor: 'pointer', 
                      fontWeight: 600 
                    }}
                  >
                    {pNum}
                  </button>
                ))}
                <button 
                  disabled={userPage === totalUserPages} 
                  onClick={() => setUserPage(prev => prev + 1)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: userPage === totalUserPages ? '#f1f5f9' : 'white', cursor: userPage === totalUserPages ? 'not-allowed' : 'pointer', fontWeight: 600, color: '#475569' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* REVIEWS */}
        {!loading && tab === 'reviews' && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ margin: 0 }}>All Reviews ({filteredReviews.length})</h3>
              {selectedReviews.size > 0 && (
                <button onClick={() => deleteBulk('review')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                  🗑️ Delete Selected ({selectedReviews.size})
                </button>
              )}
            </div>

            {/* Search & Rating Filter Bar */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="🔍 Search reviews by customer name or comment..." 
                value={reviewSearch} 
                onChange={e => setReviewSearch(e.target.value)} 
                style={{ flex: 1, minWidth: '240px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
              />
              <select 
                value={reviewRatingFilter} 
                onChange={e => setReviewRatingFilter(e.target.value)} 
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.9rem', minWidth: '160px' }}
              >
                <option value="All">All Ratings</option>
                {[5, 4, 3, 2, 1].map(r => (
                  <option key={r} value={r}>{r} ⭐</option>
                ))}
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...th, width: '40px' }}>
                      <input 
                        type="checkbox" 
                        checked={paginatedReviews.length > 0 && paginatedReviews.every(r => selectedReviews.has(r._id))}
                        onChange={toggleSelectAllReviews}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </th>
                    {['User','Rating','Comment','Date', 'Actions'].map(h=><th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {paginatedReviews.map(r => (
                    <tr key={r._id}>
                      <td style={td}>
                        <input 
                          type="checkbox" 
                          checked={selectedReviews.has(r._id)}
                          onChange={() => toggleSelectReview(r._id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={td}>{r.userName}</td>
                      <td style={td}>{r.rating} ⭐</td>
                      <td style={td}>{r.comment}</td>
                      <td style={td}>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td style={td}>
                        <button onClick={() => deleteItem('review', r._id)} style={btn('#ef4444')}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {paginatedReviews.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ ...td, textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No reviews match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalReviewPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                <button 
                  disabled={reviewPage === 1} 
                  onClick={() => setReviewPage(prev => prev - 1)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: reviewPage === 1 ? '#f1f5f9' : 'white', cursor: reviewPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, color: '#475569' }}
                >
                  Prev
                </button>
                {Array.from({ length: totalReviewPages }, (_, idx) => idx + 1).map(pNum => (
                  <button 
                    key={pNum} 
                    onClick={() => setReviewPage(pNum)}
                    style={{ 
                      padding: '8px 14px', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0', 
                      background: reviewPage === pNum ? '#fb923c' : 'white', 
                      color: reviewPage === pNum ? 'white' : '#475569', 
                      cursor: 'pointer', 
                      fontWeight: 600 
                    }}
                  >
                    {pNum}
                  </button>
                ))}
                <button 
                  disabled={reviewPage === totalReviewPages} 
                  onClick={() => setReviewPage(prev => prev + 1)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: reviewPage === totalReviewPages ? '#f1f5f9' : 'white', cursor: reviewPage === totalReviewPages ? 'not-allowed' : 'pointer', fontWeight: 600, color: '#475569' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* COUPONS */}
        {!loading && tab === 'coupons' && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Discount Coupons</h3>
              <button onClick={() => { setCouponForm({ code: '', discountValue: '', startsAt: '', expiresAt: '' }); setShowCouponModal(true); }} style={btn('#10b981')}>+ Create Coupon</button>
            </div>
             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Code','Discount','Starts','Expires', 'Actions'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c._id}>
                    <td style={td}><strong>{c.code}</strong></td>
                    <td style={td}>{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                    <td style={td}>{new Date(c.startsAt).toLocaleDateString()}</td>
                    <td style={td}>{new Date(c.expiresAt).toLocaleDateString()}</td>
                    <td style={td}>
                      <button onClick={() => deleteItem('coupon', c._id)} style={btn('#ef4444')}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* RETURNS */}
        {!loading && tab === 'returns' && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead><tr>{['Order ID','Reason','Description','Status','Date','Actions'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
               <tbody>
                {returns.map(r => {
                  if (!r) return null;
                  const orderIdStr = r.orderId ? String(r.orderId) : '';
                  return (
                    <tr key={r._id}>
                      <td style={td}>#{orderIdStr.slice(-8) || 'N/A'}</td>
                      <td style={td}>{r.reason || 'N/A'}</td>
                      <td style={td}>{r.description || 'N/A'}</td>
                      <td style={td}>{badge(r.status || 'pending')}</td>
                      <td style={td}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td style={td}>
                        {r.status === 'pending' && (
                          <>
                            <button onClick={() => handleReturnStatus(r._id, 'approved')} style={btn('#10b981')}>Approve</button>
                            <button onClick={() => handleReturnStatus(r._id, 'rejected')} style={btn('#ef4444')}>Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
               </tbody>
            </table>
          </div>
        )}

        {/* FRAME STYLES */}
        {!loading && tab === 'frameStyles' && (
          <div style={{ maxWidth: '1000px' }}>
            <h3 style={{ marginBottom: '24px' }}>Manage Frame Styles</h3>
            
            {/* Add New Frame Style Form */}
            <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #f1f5f9', marginBottom: '32px' }}>
              <h4 style={{ marginBottom: '20px' }}>
                {editingFrameStyle ? 'Edit Frame Style' : 'Add New Frame Style'}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display:'block', marginBottom:8, fontSize:'0.875rem', fontWeight:600 }}>Style Name *</label>
                  <input 
                    type="text" 
                    value={editingFrameStyle?.name || newFrameStyle.name} 
                    onChange={e => {
                      if (editingFrameStyle) setEditingFrameStyle({...editingFrameStyle, name: e.target.value});
                      else setNewFrameStyle({...newFrameStyle, name: e.target.value});
                    }}
                    placeholder="e.g., Modern"
                    style={{ width:'100%', padding:'12px', borderRadius:10, border:'1px solid #e2e8f0' }}
                  />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:8, fontSize:'0.875rem', fontWeight:600 }}>Description *</label>
                  <input 
                    type="text" 
                    value={editingFrameStyle?.description || newFrameStyle.description}
                    onChange={e => {
                      if (editingFrameStyle) setEditingFrameStyle({...editingFrameStyle, description: e.target.value});
                      else setNewFrameStyle({...newFrameStyle, description: e.target.value});
                    }}
                    placeholder="e.g., Clean & Minimalist"
                    style={{ width:'100%', padding:'12px', borderRadius:10, border:'1px solid #e2e8f0' }}
                  />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:8, fontSize:'0.875rem', fontWeight:600 }}>Border Color</label>
                  <input 
                    type="color" 
                    value={editingFrameStyle?.borderColor || newFrameStyle.borderColor}
                    onChange={e => {
                      if (editingFrameStyle) setEditingFrameStyle({...editingFrameStyle, borderColor: e.target.value});
                      else setNewFrameStyle({...newFrameStyle, borderColor: e.target.value});
                    }}
                    style={{ width:'100%', height: '45px', borderRadius:10, border:'1px solid #e2e8f0', cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:8, fontSize:'0.875rem', fontWeight:600 }}>Border Width (px) *</label>
                  <input 
                    type="number" 
                    value={editingFrameStyle?.borderWidth || newFrameStyle.borderWidth}
                    onChange={e => {
                      if (editingFrameStyle) setEditingFrameStyle({...editingFrameStyle, borderWidth: parseInt(e.target.value)});
                      else setNewFrameStyle({...newFrameStyle, borderWidth: parseInt(e.target.value)});
                    }}
                    min="1" max="50"
                    style={{ width:'100%', padding:'12px', borderRadius:10, border:'1px solid #e2e8f0' }}
                  />
                </div>
              </div>
              
              {/* Preview */}
              <div style={{ marginBottom: '20px', padding: '20px', background: '#f9f9f9', borderRadius: '10px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '12px' }}>Preview:</p>
                <div style={{
                  width: '200px',
                  height: '200px',
                  border: `${editingFrameStyle?.borderWidth || newFrameStyle.borderWidth}px solid ${editingFrameStyle?.borderColor || newFrameStyle.borderColor}`,
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fff',
                  fontSize: '0.875rem',
                  color: '#999'
                }}>
                  Preview
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    if (editingFrameStyle) {
                      const updated = frameStyles.map(f => f.id === editingFrameStyle.id ? editingFrameStyle : f);
                      setFrameStyles(updated);
                      setEditingFrameStyle(null);
                    } else {
                      if (!newFrameStyle.name || !newFrameStyle.description || newFrameStyle.borderWidth < 1) {
                        alert('Please fill all required fields');
                        return;
                      }
                      const id = 'style_' + Date.now();
                      setFrameStyles([...frameStyles, { id, ...newFrameStyle }]);
                      setNewFrameStyle({ name: '', description: '', borderColor: '#d4af37', borderWidth: 8 });
                    }
                  }}
                  style={btn('#10b981')}
                >
                  {editingFrameStyle ? 'Update Style' : 'Add Style'}
                </button>
                {editingFrameStyle && (
                  <button onClick={() => setEditingFrameStyle(null)} style={btn('#6b7280')}>
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Frame Styles List */}
            <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
              <h4 style={{ marginBottom: '20px' }}>Existing Frame Styles ({frameStyles.length})</h4>
              {frameStyles.length === 0 ? (
                <p style={{ color: '#999' }}>No frame styles added yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={th}>Name</th>
                        <th style={th}>Description</th>
                        <th style={th}>Border Color</th>
                        <th style={th}>Border Width (px)</th>
                        <th style={th}>Preview</th>
                        <th style={th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {frameStyles.map(style => (
                        <tr key={style.id}>
                          <td style={td}><strong>{style.name}</strong></td>
                          <td style={td}>{style.description}</td>
                          <td style={td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                background: style.borderColor,
                                borderRadius: '4px',
                                border: '1px solid #ddd'
                              }} />
                              <span style={{ fontSize: '0.875rem', color: '#666' }}>{style.borderColor}</span>
                            </div>
                          </td>
                          <td style={td}>{style.borderWidth}</td>
                          <td style={td}>
                            <div style={{
                              width: '60px',
                              height: '60px',
                              border: `${style.borderWidth}px solid ${style.borderColor}`,
                              borderRadius: '4px'
                            }} />
                          </td>
                          <td style={td}>
                            <button
                              onClick={() => setEditingFrameStyle(style)}
                              style={btn('#3b82f6')}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                const idx = frameStyles.findIndex(f => f.id === style.id);
                                if (idx > -1) {
                                  const updated = frameStyles.filter((_, i) => i !== idx);
                                  setFrameStyles(updated);
                                }
                              }}
                              style={btn('#ef4444')}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {!loading && tab === 'settings' && (
          <div style={{ maxWidth: '600px', background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
            <h3 style={{ marginBottom: '24px' }}>Store Settings</h3>
            {['siteName', 'contactEmail', 'contactPhone'].map(f => (
              <div key={f} style={{ marginBottom: '20px' }}>
                <label style={{ display:'block', marginBottom:8, fontSize:'0.875rem', fontWeight:600 }}>{f.replace(/([A-Z])/g, ' $1').toUpperCase()}</label>
                <input type="text" value={settings[f]} onChange={e=>setSettings({...settings, [f]: e.target.value})} style={{ width:'100%', padding:'12px', borderRadius:10, border:'1px solid #e2e8f0' }}/>
              </div>
            ))}
            <button onClick={async () => {
               const r = await fetch(`${API}/settings`, { method: 'PUT', headers, body: JSON.stringify(settings) });
               if(r.ok) addToast('Settings updated', 'success');
            }} style={{ width:'100%', padding:'14px', background:'#fb923c', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>Save Settings</button>
          </div>
        )}

      </div>

      {/* PRODUCT MODAL */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'white', padding:32, borderRadius:20, width:'100%', maxWidth:500, maxHeight:'90vh', overflowY:'auto' }}>
            <h2>{editingId ? 'Edit Product' : 'New Product'}</h2>
            {['name', 'basePrice', 'stock'].map(f => (
              <div key={f} style={{ marginBottom:16 }}>
                <label style={{ display:'block', marginBottom:6 }}>{f.toUpperCase()}</label>
                <input type={f==='name'?'text':'number'} value={editProduct[f]} onChange={e=>setEditProduct({...editProduct, [f]: e.target.value})} style={{ width:'100%', padding:10, borderRadius:8, border:'1px solid #ddd' }}/>
              </div>
            ))}
            <div style={{ marginBottom:16 }}>
              <label>CATEGORY</label>
              <select value={editProduct.category} onChange={e=>setEditProduct({...editProduct, category: e.target.value})} style={{ width:'100%', padding:10, borderRadius:8, border:'1px solid #ddd' }}>
                {['God','Warriors','New Arrivals','Custom'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:16 }}>
              <label>SKU (Optional)</label>
              <input 
                type="text" 
                value={editProduct.sku || ''} 
                onChange={e=>setEditProduct({...editProduct, sku: e.target.value})} 
                placeholder="e.g., SHIV-001 (auto-generated if empty)"
                style={{ width:'100%', padding:10, borderRadius:8, border:'1px solid #ddd' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Leave empty for auto-generated SKU</p>
            </div>
            <div style={{ marginBottom:16 }}>
              <label>PRODUCT IMAGE</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (!file.type.startsWith('image/')) {
                    addToast('Only image files are allowed!', 'error');
                    e.target.value = null;
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    addToast('Image size cannot exceed 5MB!', 'error');
                    e.target.value = null;
                    return;
                  }
                  setImageFile(file);
                }} 
                style={{ width:'100%', padding:10, borderRadius:8, border:'1px solid #ddd', marginTop: 5 }}
              />
              {(imageFile || editProduct.images[0]) && (
                <div style={{ marginTop: 10 }}>
                  <img 
                    src={imageFile ? URL.createObjectURL(imageFile) : editProduct.images[0]} 
                    alt="Preview" 
                    style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }}
                  />
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{imageFile ? 'New image selected' : 'Current image'}</p>
                </div>
              )}
            </div>
             <div style={{ marginBottom:20 }}>
              <label>DESCRIPTION</label>
              <textarea value={editProduct.description} onChange={e=>setEditProduct({...editProduct, description: e.target.value})} style={{ width:'100%', padding:10, borderRadius:8, border:'1px solid #ddd' }} rows={3}/>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setShowModal(false)} style={{ flex:1, padding:12, borderRadius:10, border:'1px solid #ddd' }}>Cancel</button>
              <button onClick={saveProduct} style={{ flex:1, padding:12, borderRadius:10, background:'#10b981', color:'white', border:'none', fontWeight:700 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS MODAL */}
      {showStatusModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'white', padding:32, borderRadius:20, width:320 }}>
            <h3>Update Status</h3>
            <select value={newStatus} onChange={e=>setNewStatus(e.target.value)} style={{ width:'100%', padding:12, borderRadius:10, border:'1px solid #ddd', marginBottom:20 }}>
              {['Pending','Processing','Shipped','Delivered','Cancelled'].map(s=><option key={s}>{s}</option>)}
            </select>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setShowStatusModal(false)} style={{ flex:1, padding:10 }}>Cancel</button>
              <button onClick={updateOrderStatus} style={{ flex:1, padding:10, background:'#fb923c', color:'white', border:'none', borderRadius:10 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {showOrderDetails && selectedOrder && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'white', padding:32, borderRadius:20, width:'100%', maxWidth:600, maxHeight:'80vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3>Order Details</h3>
              <button onClick={()=>setShowOrderDetails(false)} style={{ fontSize:'1.5rem', border:'none', background:'none', cursor:'pointer' }}>×</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:30, padding:20, background:'#f8fafc', borderRadius:12 }}>
              <div><strong>Customer:</strong> {selectedOrder.customerName}</div>
              <div><strong>Email:</strong> {selectedOrder.email}</div>
              <div><strong>Phone:</strong> {selectedOrder.shippingAddress?.phone || selectedOrder.phone || 'N/A'}</div>
              <div><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
              <div style={{ gridColumn: 'span 2' }}><strong>Address:</strong> {selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city} - {selectedOrder.shippingAddress?.postalCode}</div>
            </div>
            <h4 style={{ marginBottom:16 }}>Items</h4>
            {selectedOrder.orderItems.map((it, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'16px', borderRadius: '8px', background:'#f9f9f9', marginBottom:'12px', border:'1px solid #f1f5f9' }}>
                <div style={{ display:'flex', gap:12, flex: 1 }}>
                  {(it.customization?.userUploadedImage || it.product?.images?.[0]) && <img src={it.customization?.userUploadedImage || it.product.images[0]} style={{ width:60, height:60, objectFit:'cover', borderRadius:8 }} alt="" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight:700, marginBottom: '4px' }}>{it.name}</div>
                    {it.product?.sku && <div style={{ fontSize:'0.8rem', color:'#64748b' }}>SKU: <strong>{it.product.sku}</strong></div>}
                    {it.product?._id && (
                      <div style={{ fontSize:'0.75rem', color:'#6366f1', marginTop: '2px', padding: '2px 6px', background: '#eef2ff', borderRadius: '3px', display: 'inline-block', fontFamily: 'monospace' }}>
                        ID: {it.product._id.slice(0, 8)}
                      </div>
                    )}
                    <div style={{ fontSize:'0.8rem', color:'#64748b', marginTop: '4px' }}>
                      Qty: {it.quantity}
                      {(it.customization?.selectedSize || it.size) && ` | Size: ${it.customization?.selectedSize || it.size}`}
                      {it.customization?.selectedColor && ` | Color: ${it.customization.selectedColor}`}
                      {it.customization?.orientation && ` | Orientation: ${it.customization.orientation}`}
                    </div>
                    {it.customization?.hasCustomization && (
                      <div style={{ fontSize:'0.75rem', color:'#fb923c', marginTop: '6px', padding: '4px 8px', background: '#fff3e0', borderRadius: '4px', display: 'inline-block' }}>
                        ✓ Custom Image Used
                      </div>
                    )}
                    {it.customization?.userUploadedImage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                        <img
                          src={it.customization.userUploadedImage}
                          alt="Selected custom"
                          style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12, border: '1px solid #ddd' }}
                        />
                        <button
                          onClick={() => downloadImageFile(it.customization.userUploadedImage, `${(it.name || 'custom-image').replace(/\s+/g, '_')}.png`)}
                          style={{ ...btn('#3b82f6'), padding: '10px 14px', marginRight: 0 }}
                        >
                          Download Selected Image
                        </button>
                      </div>
                    )}
                    {it.product?._id && (
                      <div style={{ marginTop: '8px' }}>
                        <Barcode value={it.product._id} width={1.2} height={35} fontSize={9} displayValue={false} />
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ fontWeight:700, textAlign: 'right' }}>₹{it.price * it.quantity}</div>
              </div>
            ))}
            <div style={{ marginTop:24, padding: '16px', background: '#f0f9ff', borderRadius: '8px', textAlign:'right', marginBottom: '16px' }}>
              <div style={{ fontSize:'0.9rem', color: '#64748b', marginBottom: '8px' }}>Subtotal: ₹{selectedOrder.totalPrice}</div>
              <div style={{ fontSize:'1.3rem', fontWeight:800, color: '#1e293b' }}>Total: ₹{selectedOrder.totalPrice}</div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setShowOrderDetails(false)} style={{ flex:1, padding:'12px', borderRadius:10, border:'1px solid #ddd', cursor:'pointer', fontWeight:600 }}>Close</button>
              <button onClick={() => {
                const printWin = window.open('', '_blank', 'width=800,height=600');
                const barcodeHTML = selectedOrder.orderItems.map((it, idx) => {
                  if (!it.product?._id) return '';
                  const code = it.product._id.slice(-8).toUpperCase();
                  return `<div class="barcode-item">
                    <div class="item-number">Item ${idx + 1}</div>
                    <div class="product-name">${it.name}</div>
                    ${it.product?.sku ? `<div class="sku">SKU: ${it.product.sku}</div>` : ''}
                    <svg id="bc-${idx}" style="margin: 10px auto; display: block;"></svg>
                    <div class="quantity">Qty: ${it.quantity}</div>
                  </div>`;
                }).join('');
                
                const barcodeScripts = selectedOrder.orderItems.map((it, idx) => {
                  if (!it.product?._id) return '';
                  const code = it.product._id.slice(-8).toUpperCase();
                  return `JsBarcode('#bc-${idx}','${code}',{format:'CODE128',width:1.5,height:50,fontSize:11,margin:5});`;
                }).join('\n');
                
                printWin.document.write(`<html><head><title>Order #${selectedOrder._id.slice(-8)} - Barcodes</title>
                  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
                  <style>
                    body{font-family:Arial,sans-serif;padding:20px;background:#f9f9f9;}
                    .header{text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:15px;}
                    .order-id{font-size:16px;font-weight:bold;color:#1e293b;}
                    .customer{font-size:12px;color:#64748b;margin-top:5px;}
                    .barcode-item{border:2px dashed #ccc;padding:20px;margin:15px auto;max-width:400px;text-align:center;border-radius:8px;page-break-inside:avoid;background:white;}
                    .item-number{font-size:13px;color:#6366f1;font-weight:bold;margin-bottom:5px;}
                    .product-name{font-weight:bold;font-size:14px;color:#1e293b;margin-bottom:5px;}
                    .sku{font-size:11px;color:#64748b;margin-bottom:8px;}
                    .quantity{font-size:11px;color:#64748b;margin-top:8px;}
                    .no-print{text-align:center;margin-top:30px;}
                    .print-btn{padding:12px 40px;font-size:16px;cursor:pointer;background:#6366f1;color:white;border:none;border-radius:8px;font-weight:bold;}
                    @media print{.no-print{display:none;}.header{page-break-after:avoid;}}
                  </style></head><body>
                  <div class="header">
                    <div class="order-id">Order #${selectedOrder._id.slice(-8)}</div>
                    <div class="customer">Customer: ${selectedOrder.customerName}</div>
                    <div class="customer">Date: ${new Date(selectedOrder.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style="margin-bottom:20px;">
                    ${barcodeHTML}
                  </div>
                  <div class="no-print">
                    <button class="print-btn" onclick="window.print()">🖨️ Print Barcodes</button>
                  </div>
                  <script>${barcodeScripts}<\/script>
                  </body></html>`);
                printWin.document.close();
              }} style={{ flex:1, padding:'12px', borderRadius:10, background:'#6366f1', color:'white', border:'none', cursor:'pointer', fontWeight:600 }}>🖨️ Print Barcodes</button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE BARCODE MODAL */}
      {showBarcodeModal && barcodeProduct && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'white', padding:32, borderRadius:20, width:'100%', maxWidth:420, textAlign:'center' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ margin:0 }}>Product Barcode</h3>
              <button onClick={()=>setShowBarcodeModal(false)} style={{ fontSize:'1.5rem', border:'none', background:'none', cursor:'pointer' }}>×</button>
            </div>
            <div style={{ background:'#f8fafc', borderRadius:12, padding:24, marginBottom:16, border:'1px solid #e2e8f0' }}>
              <div style={{ marginBottom:12 }}>
                <Barcode value={barcodeProduct._id} width={2} height={60} fontSize={14} />
              </div>
              <div style={{ fontWeight:700, fontSize:'1.1rem', color:'#1e293b', marginBottom:4 }}>{barcodeProduct.name}</div>
              <div style={{ fontSize:'0.85rem', color:'#64748b' }}>₹{barcodeProduct.basePrice} • {barcodeProduct.category}</div>
              <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:4 }}>ID: {barcodeProduct._id}</div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setShowBarcodeModal(false)} style={{ flex:1, padding:12, borderRadius:10, border:'1px solid #ddd', cursor:'pointer', fontWeight:600 }}>Close</button>
              <button onClick={() => {
                const printWin = window.open('', '_blank', 'width=400,height=500');
                const barcodeCode = barcodeProduct._id.slice(-8).toUpperCase();
                printWin.document.write(`<html><head><title>Barcode - ${barcodeProduct.name}</title>
                  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
                  <style>body{font-family:Arial,sans-serif;text-align:center;padding:30px;}
                  .label{border:2px dashed #ccc;padding:20px;margin:10px auto;max-width:300px;border-radius:10px;}
                  @media print{.no-print{display:none;}.label{border:2px solid #000;}}</style></head><body>
                  <div class="label">
                    <svg id="bc"></svg>
                    <div style="font-weight:bold;font-size:16px;margin-top:8px;">${barcodeProduct.name}</div>
                    <div style="color:#666;font-size:13px;">₹${barcodeProduct.basePrice} • ${barcodeProduct.category}</div>
                  </div>
                  <button class="no-print" onclick="window.print()" style="margin-top:20px;padding:10px 30px;font-size:16px;cursor:pointer;background:#6366f1;color:white;border:none;border-radius:8px;">🖨️ Print</button>
                  <script>JsBarcode('#bc','${barcodeCode}',{format:'CODE128',width:2,height:60,fontSize:14,margin:4});<\/script>
                  </body></html>`);
                printWin.document.close();
              }} style={{ flex:1, padding:12, borderRadius:10, background:'#6366f1', color:'white', border:'none', cursor:'pointer', fontWeight:700 }}>🖨️ Print Barcode</button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT ALL BARCODES MODAL */}
      {showAllBarcodes && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'white', padding:32, borderRadius:20, width:'100%', maxWidth:800, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h3 style={{ margin:0 }}>All Product Barcodes ({products.length})</h3>
              <button onClick={()=>setShowAllBarcodes(false)} style={{ fontSize:'1.5rem', border:'none', background:'none', cursor:'pointer' }}>×</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:16, marginBottom:24 }}>
              {products.map(p => (
                <div key={p._id} style={{ border:'2px dashed #e2e8f0', borderRadius:12, padding:16, textAlign:'center', background:'#fafbfc' }}>
                  <Barcode value={p._id} width={1.3} height={40} fontSize={10} />
                  <div style={{ fontWeight:700, fontSize:'0.85rem', color:'#1e293b', marginTop:6, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize:'0.75rem', color:'#64748b' }}>₹{p.basePrice} • {p.category}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={()=>setShowAllBarcodes(false)} style={{ padding:'12px 24px', borderRadius:10, border:'1px solid #ddd', cursor:'pointer', fontWeight:600 }}>Close</button>
              <button onClick={() => {
                const printWin = window.open('', '_blank', 'width=900,height=700');
                const barcodeItems = products.map(p => {
                  const code = p._id.slice(-8).toUpperCase();
                  return `<div class="label"><svg id="bc-${p._id}"></svg><div class="name">${p.name}</div><div class="info">₹${p.basePrice} • ${p.category}</div></div>`;
                }).join('');
                const barcodeScripts = products.map(p => {
                  const code = p._id.slice(-8).toUpperCase();
                  return `JsBarcode('#bc-${p._id}','${code}',{format:'CODE128',width:1.3,height:40,fontSize:10,margin:4});`;
                }).join('\n');
                printWin.document.write(`<html><head><title>All Product Barcodes</title>
                  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
                  <style>
                    body{font-family:Arial,sans-serif;padding:20px;}
                    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
                    .label{border:2px dashed #ccc;padding:14px;text-align:center;border-radius:8px;page-break-inside:avoid;}
                    .name{font-weight:bold;font-size:12px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
                    .info{color:#666;font-size:11px;}
                    @media print{.no-print{display:none;}.label{border:2px solid #000;}}
                  </style></head><body>
                  <h2 style="text-align:center;margin-bottom:20px;">Vitthal Photo Frames - Product Barcodes</h2>
                  <div class="grid">${barcodeItems}</div>
                  <div class="no-print" style="text-align:center;margin-top:24px;">
                    <button onclick="window.print()" style="padding:12px 40px;font-size:16px;cursor:pointer;background:#6366f1;color:white;border:none;border-radius:8px;">🖨️ Print All Barcodes</button>
                  </div>
                  <script>${barcodeScripts}<\/script>
                  </body></html>`);
                printWin.document.close();
              }} style={{ padding:'12px 24px', borderRadius:10, background:'#6366f1', color:'white', border:'none', cursor:'pointer', fontWeight:700 }}>🖨️ Print All Barcodes</button>
            </div>
          </div>
        </div>
      )}

      {/* COUPON MODAL */}
      {showCouponModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'white', padding:32, borderRadius:20, width:'100%', maxWidth:400 }}>
            <h2 style={{ marginBottom: 20 }}>Create Coupon</h2>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', marginBottom:6 }}>Code</label>
              <input type="text" value={couponForm.code} onChange={e=>setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} style={{ width:'100%', padding:10, borderRadius:8, border:'1px solid #ddd' }} />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', marginBottom:6 }}>Discount (₹)</label>
              <input type="number" value={couponForm.discountValue} onChange={e=>setCouponForm({...couponForm, discountValue: e.target.value, discountType: 'fixed'})} style={{ width:'100%', padding:10, borderRadius:8, border:'1px solid #ddd' }} />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', marginBottom:6 }}>Valid From</label>
              <input type="date" value={couponForm.startsAt} onChange={e=>setCouponForm({...couponForm, startsAt: e.target.value})} style={{ width:'100%', padding:10, borderRadius:8, border:'1px solid #ddd' }} />
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', marginBottom:6 }}>Valid Until</label>
              <input type="date" value={couponForm.expiresAt} onChange={e=>setCouponForm({...couponForm, expiresAt: e.target.value})} style={{ width:'100%', padding:10, borderRadius:8, border:'1px solid #ddd' }} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setShowCouponModal(false)} style={{ flex:1, padding:12, borderRadius:10, border:'1px solid #ddd' }}>Cancel</button>
              <button onClick={handleSaveCoupon} style={{ flex:1, padding:12, borderRadius:10, background:'#10b981', color:'white', border:'none', fontWeight:700 }}>Save</button>
            </div>
          </div>
        </div>
      )}
      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal.show && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.65)', backdropFilter:'blur(4px)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'white', padding:32, borderRadius:24, width:'100%', maxWidth:420, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', border:'1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: '#fee2e2', color: '#ef4444', fontSize: '1.5rem' }}>
                ⚠️
              </div>
              <h3 style={{ margin:0, color:'#1e293b', fontWeight:800, fontSize:'1.25rem' }}>{confirmModal.title || 'Are you sure?'}</h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              {confirmModal.message}
            </p>
            <div style={{ display:'flex', gap:12 }}>
              <button onClick={()=>setConfirmModal({ show: false, title: '', message: '', onConfirm: null })} style={{ flex:1, padding:'12px', borderRadius:12, border:'1px solid #e2e8f0', background: 'white', color: '#475569', cursor:'pointer', fontWeight:600, fontSize: '0.95rem' }}>
                Cancel
              </button>
              <button onClick={confirmModal.onConfirm} style={{ flex:1, padding:'12px', borderRadius:12, background:'#ef4444', color:'white', border:'none', fontWeight:700, cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(239,68,68,0.25)' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
