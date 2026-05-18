import React from 'react';

const PolicyLayout = ({ title, children }) => (
  <div className="policy-container" style={{ padding: '80px 20px', maxWidth: '900px', margin: '0 auto', lineHeight: '1.8' }}>
    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '40px', textAlign: 'center' }}>{title}</h1>
    <div className="policy-content" style={{ color: '#444' }}>
      {children}
    </div>
  </div>
);

export const PrivacyPolicy = () => (
  <PolicyLayout title="Privacy Policy">
    <p>Last Updated: May 10, 2026</p>
    <h2>1. Introduction</h2>
    <p>Welcome to Vitthal Photo Frames. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website.</p>
    
    <h2>2. Data We Collect</h2>
    <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
    <ul>
      <li>Identity Data: Name, username.</li>
      <li>Contact Data: Email address, telephone numbers, shipping address.</li>
      <li>Financial Data: Payment card details (processed securely via third-party processors).</li>
      <li>Transaction Data: Details about payments to and from you and other details of products you have purchased from us.</li>
    </ul>

    <h2>3. How We Use Your Data</h2>
    <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data to perform the contract we are about to enter into or have entered into with you (e.g., to deliver your photo frames).</p>
  </PolicyLayout>
);

export const TermsOfService = () => (
  <PolicyLayout title="Terms of Service">
    <p>Last Updated: May 10, 2026</p>
    <h2>1. Acceptance of Terms</h2>
    <p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.</p>
    
    <h2>2. Products and Pricing</h2>
    <p>All products listed on the website, their descriptions, and their prices are subject to change. Vitthal Photo Frames reserves the right, at any time, to modify, suspend, or discontinue the sale of any product.</p>

    <h2>3. Shipping and Delivery</h2>
    <p>Delivery times are estimates and not guaranteed. We are not responsible for delays caused by the shipping carrier or customs.</p>
  </PolicyLayout>
);

export const RefundPolicy = () => (
  <PolicyLayout title="Refund & Cancellation Policy">
    <p>Last Updated: May 10, 2026</p>
    <h2>1. Cancellation</h2>
    <p>You can cancel your order within 24 hours of placing it. Once the frame has entered the production/framing stage, cancellations may not be possible.</p>
    
    <h2>2. Returns</h2>
    <p>We offer a 7-day return policy for damaged or defective products. To be eligible for a return, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging.</p>

    <h2>3. Refunds</h2>
    <p>We will notify you once we’ve received and inspected your return, and let you know if the refund was approved or not. If approved, you’ll be automatically refunded on your original payment method.</p>
  </PolicyLayout>
);
