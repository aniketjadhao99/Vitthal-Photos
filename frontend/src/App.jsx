import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import ProductDetails from './pages/ProductDetails';
import GodFrames from './pages/GodFrames';
import WarriorFrames from './pages/WarriorFrames';
import NewArrivals from './pages/NewArrivals';
import CustomFrame from './pages/CustomFrame';
import CollageFrames from './pages/CollageFrames';
import FamilyFrames from './pages/FamilyFrames';
import KidsFrames from './pages/KidsFrames';
import Auth from './pages/Auth';
import AdminPanel from './pages/AdminPanel';
import Search from './pages/Search';
import OrderSuccess from './pages/OrderSuccess';
import { PrivacyPolicy, TermsOfService, RefundPolicy } from './pages/Legal';
import FAQ from './pages/FAQ';
import NotFound from './pages/NotFound';

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app-wrapper">
      {!isAdminRoute && <Header />}
      <main>
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
      </main>
      {!isAdminRoute && <Footer />}
      
      {/* Floating Support Button */}
      <a 
        href="https://wa.me/919876543210" 
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
