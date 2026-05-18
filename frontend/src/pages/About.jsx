import React from 'react';

const About = () => {
  return (
    <>
      <div className="breadcrumbs">
        <a href="/">Home &gt;</a> About Us
      </div>

      <div className="about-hero">
        <h1>Preserving Memories, Elevating Art</h1>
        <p>Handcrafted Frames for Your Divine & Cherished Moments</p>
      </div>

      <section className="about-section">
        <h2>Our Story</h2>
        <p>
          Founded in the heart of India, Vitthal Photo Frames began with a simple mission: to give every picture the
          home it deserves. We believe that a photo frame is not just a border for an image, but a vessel for
          memories, devotion, and art.
        </p>
        <p>
          Specializing in premium teak wood frames, we combine traditional craftsmanship with modern printing
          technology. Whether it's a divine deity that brings peace to your home or a custom memory of a loved one,
          our frames are built to last a lifetime.
        </p>
      </section>

      <section className="features-board" style={{ background: '#fff', marginBottom: '60px' }}>
        <div className="Board">
          <div className="feature">
            <div className="Symbols"><span className="material-symbols-outlined text-2xl">workspace_premium</span></div>
            <div className="feature-text">
              <h3>Quality Craftsmanship</h3>
              <p>Finest materials & finish</p>
            </div>
          </div>
          <div className="feature">
            <div className="Symbols"><span className="material-symbols-outlined text-2xl">local_shipping</span></div>
            <div className="feature-text">
              <h3>Pan India Delivery</h3>
              <p>Safe & secure shipping</p>
            </div>
          </div>
          <div className="feature">
            <div className="Symbols"><span className="material-symbols-outlined text-2xl">support_agent</span></div>
            <div className="feature-text">
              <h3>24/7 Support</h3>
              <p>We are here to help</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
