import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

import Home from './pages/Home';
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Profile = lazy(() => import('./pages/Profile'));
const Cart = lazy(() => import('./pages/Cart'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Checkout = lazy(() => import('./pages/Checkout'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const GodFrames = lazy(() => import('./pages/GodFrames'));
const WarriorFrames = lazy(() => import('./pages/WarriorFrames'));
const NewArrivals = lazy(() => import('./pages/NewArrivals'));
const CustomFrame = lazy(() => import('./pages/CustomFrame'));
const CollageFrames = lazy(() => import('./pages/CollageFrames'));
const FamilyFrames = lazy(() => import('./pages/FamilyFrames'));
const KidsFrames = lazy(() => import('./pages/KidsFrames'));
const Auth = lazy(() => import('./pages/Auth'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Search = lazy(() => import('./pages/Search'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const FAQ = lazy(() => import('./pages/FAQ'));
const NotFound = lazy(() => import('./pages/NotFound'));
import { PrivacyPolicy, TermsOfService, RefundPolicy } from './pages/Legal';

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app-wrapper">
      {!isAdminRoute && <Header />}
      <main>
        <Suspense fallback={<div className="route-loading">Loading page…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/wishlist" element={<Wishlist />} />
            
            {/* Category Pages */}
            <Route path="/god" element={<GodFrames />} />
            <Route path="/warriors" element={<WarriorFrames />} />
            <Route path="/collage" element={<CollageFrames />} />
            <Route path="/family" element={<FamilyFrames />} />
            <Route path="/kids" element={<KidsFrames />} />
            <Route path="/custom" element={<CustomFrame />} />
            <Route path="/new" element={<NewArrivals />} />
            <Route path="/search" element={<Search />} />
            
            {/* Product Details */}
            <Route path="/product/:id" element={<ProductDetails />} />

            {/* Order Success */}
            <Route path="/order-success" element={<OrderSuccess />} />

            {/* Legal and Info */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/faq" element={<FAQ />} />

            {/* Admin Panel */}
            <Route path="/admin" element={<AdminPanel />} />

            {/* 404 Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdminRoute && <Footer />}
      
      {/* Floating Support Button */}
      <a 
        href="https://wa.me/919822329950" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          backgroundColor: '#25d366',
          color: 'white',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '30px',
          boxShadow: '0 10px 25px rgba(37, 211, 102, 0.3)',
          zIndex: 999,
          transition: 'all 0.3s ease',
          textDecoration: 'none'
        }}
        className="whatsapp-float"
      >
        <i className="bi bi-whatsapp"></i>
      </a>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
