import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';

const API_URL = '/api';

const Reviews = ({ productId, pageName }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const user = JSON.parse(localStorage.getItem('vitthal_user') || 'null');
  const token = localStorage.getItem('vitthal_token');

  const fetchReviews = async () => {
    try {
      const targetId = productId || pageName;
      const type = pageName ? 'page' : 'product';
      const res = await fetch(`${API_URL}/reviews/${targetId}?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, pageName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      addToast('Please login to submit a review', 'error');
      return;
    }
    if (!comment) {
      addToast('Please enter a comment', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating,
          comment,
          productId,
          pageName
        })
      });

      if (res.ok) {
        addToast('Review submitted successfully!', 'success');
        setComment('');
        setRating(5);
        fetchReviews();
      } else {
        const data = await res.json();
        addToast(data.message || 'Error submitting review', 'error');
      }
    } catch (err) {
      addToast('Error submitting review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    if (!token) {
      addToast('Please login to mark as helpful', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="reviews-container-premium" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      <h2 style={{ fontSize: '2.2rem', marginBottom: '40px', fontWeight: 800, textAlign: 'center' }}>Customer Experiences</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: reviews.length > 0 ? '1fr 1fr' : '1fr', gap: '50px', alignItems: 'start' }}>
        
        {/* Left: Review List */}
        <div className="reviews-list">
          {loading ? (
            <p>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '15px' }}>
              <i className="bi bi-chat-dots" style={{ fontSize: '3rem', color: '#ddd' }}></i>
              <p style={{ color: '#888', marginTop: '10px' }}>No reviews yet. Be the first to share your experience!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {reviews.map((rev) => (
                <div key={rev._id} style={{ background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div className="stars" style={{ color: '#fa873b' }}>
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#999' }}>{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ color: '#444', marginBottom: '15px', lineHeight: '1.6' }}>"{rev.comment}"</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#1a1a1a' }}>- {rev.userName}</strong>
                    <button 
                      onClick={() => handleHelpful(rev._id)}
                      style={{ 
                        background: 'none', 
                        border: '1px solid #eee', 
                        borderRadius: '20px', 
                        padding: '5px 12px', 
                        fontSize: '0.8rem', 
                        cursor: 'pointer',
                        color: rev.helpfulBy?.includes(user?._id) ? '#fa873b' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <i className={`bi ${rev.helpfulBy?.includes(user?._id) ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}`}></i>
                      Helpful ({rev.helpfulBy?.length || 0})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Submit Form */}
        <div className="submit-review-form" style={{ background: 'white', padding: '35px', borderRadius: '20px', boxShadow: '0 15px 40px rgba(0,0,0,0.08)', position: 'sticky', top: '100px' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', fontWeight: 700 }}>Write a Review</h3>
          {!token ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ marginBottom: '20px', color: '#666' }}>Please log in to share your review with others.</p>
              <a href="/login" style={{ 
                padding: '10px 25px', 
                background: '#1a1a1a', 
                color: 'white', 
                borderRadius: '8px', 
                textDecoration: 'none',
                fontWeight: '600'
              }}>Login Now</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>Your Rating</label>
                <div style={{ display: 'flex', gap: '10px', fontSize: '1.5rem', color: '#fa873b' }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <i 
                      key={num}
                      className={`bi ${num <= rating ? 'bi-star-fill' : 'bi-star'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setRating(num)}
                    ></i>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>Your Experience</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike? How was the quality?"
                  style={{ 
                    width: '100%', 
                    padding: '15px', 
                    borderRadius: '12px', 
                    border: '1px solid #eee', 
                    minHeight: '120px',
                    fontSize: '1rem',
                    background: '#fcfcfc',
                    boxSizing: 'border-box'
                  }}
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                style={{ 
                  width: '100%', 
                  padding: '15px', 
                  background: '#fa873b', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: '700', 
                  fontSize: '1.1rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 5px 15px rgba(250, 135, 59, 0.3)'
                }}
              >
                {submitting ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default Reviews;
