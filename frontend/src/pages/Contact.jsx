import React, { useState } from 'react';
import { useToast } from '../components/Toast';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        addToast('Message sent successfully! We will get back to you soon.', 'success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        const err = await res.json();
        addToast(err.message || 'Failed to send message', 'error');
      }
    } catch (error) {
      addToast('Error sending message', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="breadcrumbs">
        <a href="/">Home &gt;</a> Contact Us
      </div>

      <div className="contact-container">
        <div className="contact-info">
          <h2>Get In Touch</h2>
          <p style={{ marginBottom: '30px' }}>We'd love to hear from you. Visit our store or send us a message.</p>

          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span className="material-symbols-outlined" style={{ color: '#fa873b', fontSize: '28px' }}>location_on</span>
            <div>
              <strong>Store Address</strong>
              <p>Vitthal Photo Frames, Main Market, Pune, Maharashtra 411002</p>
            </div>
          </div>

          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span className="material-symbols-outlined" style={{ color: '#fa873b', fontSize: '28px' }}>call</span>
            <div>
              <strong>Phone</strong>
              <p>+91 9876543210</p>
            </div>
          </div>

          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span className="material-symbols-outlined" style={{ color: '#fa873b', fontSize: '28px' }}>mail</span>
            <div>
              <strong>Email</strong>
              <p>vitthalphotos99@gmail.com</p>
            </div>
          </div>

          <div style={{ marginTop: '40px', borderRadius: '10px', overflow: 'hidden', height: '250px', background: '#eee' }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3783.250567632675!2d73.85674371489269!3d18.52043028740526!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c06fd71777b9%3A0x6b47e2311749747a!2sPune%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1642134567890!5m2!1sen!2sin"
              width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" title="Google Maps"></iframe>
          </div>
        </div>

        <div className="contact-form-box">
          <h2>Send Message</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Your Name</label>
              <input type="text" placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input type="text" placeholder="Inquiry about custom frames" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea rows="5" placeholder="How can we help you?" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required></textarea>
            </div>
            <button type="submit" className="submit-btn" disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Contact;
