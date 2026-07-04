import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src="/assets/images/logo.png" alt="Vitthal Photos" />
            </Link>
            <p className="brand-desc">
              Preserving culture through art. Premium photo frames crafted with love, devotion, and Indian heritage. 
              Elevate your space with our divine collection.
            </p>
            <div className="social-links">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <i className="bi bi-twitter"></i>
              </a>
              <a href="https://wa.me/919822329950" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <i className="bi bi-whatsapp"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links-group">
            <h3>Explore</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/god">God Frames</Link></li>
              <li><Link to="/warriors">Warriors</Link></li>
              <li><Link to="/custom">Custom Mosaic</Link></li>
              <li><Link to="/new">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="footer-links-group">
            <h3>Support</h3>
            <ul>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/refund-policy">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="footer-contact">
            <h3>Stay Connected</h3>
            <p>Subscribe for exclusive offers and cultural updates.</p>
            <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alert('Thank you for subscribing!'); }}>
              <input type="email" placeholder="Email Address" required />
              <button type="submit">Subscribe</button>
            </form>
            <div className="footer-contact-info">
              <a href="tel:+919876543210">
                <i className="bi bi-telephone-fill"></i> +91 9876543210
              </a>
              <a href="mailto:vitthalphotos99@gmail.com">
                <i className="bi bi-envelope-fill"></i> vitthalphotos99@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Vitthal Photos. Handcrafted in India.</p>
          <div className="payment-icons">
            <i className="bi bi-credit-card"></i>
            <i className="bi bi-wallet2"></i>
            <i className="bi bi-bank"></i>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
