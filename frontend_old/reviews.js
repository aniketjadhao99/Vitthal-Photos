const REVIEWS_API = `${window.API_URL || 'http://localhost:5000/api'}/reviews`;

class ReviewSystem {
    constructor() {
        this.getToken = () => localStorage.getItem('vitthal_token');
    }

    // Get reviews for a product or page from API
    async getReviews(targetId, type = 'product') {
        try {
            const response = await fetch(`${REVIEWS_API}/${targetId}?type=${type}`);
            if (!response.ok) throw new Error('Failed to fetch reviews');
            return await response.json();
        } catch (error) {
            console.error('Error fetching reviews:', error);
            return [];
        }
    }

    // Add a new review via API
    async addReview(targetId, rating, comment, isPage = false) {
        const token = this.getToken();
        if (!token) {
            alert('Please login to write a review');
            return null;
        }

        const body = { rating, comment };
        if (isPage) body.pageName = targetId;
        else body.productId = targetId;

        try {
            const response = await fetch(REVIEWS_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to submit review');
            }

            return await response.json();
        } catch (error) {
            alert(error.message);
            return null;
        }
    }

    // Mark review as helpful via API
    async markAsHelpful(reviewId) {
        const token = this.getToken();
        if (!token) {
            alert('Please login to mark as helpful');
            return null;
        }

        try {
            const response = await fetch(`${REVIEWS_API}/${reviewId}/helpful`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to update helpful status');
            return await response.json();
        } catch (error) {
            console.error('Helpful status error:', error);
            return null;
        }
    }

    // Get average rating (calculated from array)
    getAverageRating(reviews) {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / reviews.length).toFixed(1);
    }
}

const reviewSystem = new ReviewSystem();

// Create review form HTML (Premium)
function createReviewForm(productId) {
    return `
        <div class="review-form-premium" style="margin-top: 60px; padding: 40px; background: #fff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 30px;">
                <div style="width: 45px; height: 45px; background: #fa873b; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white;">
                    <i class="bi bi-chat-left-dots-fill" style="font-size: 1.2rem;"></i>
                </div>
                <div>
                    <h3 style="font-size: 1.25rem; font-weight: 800; margin: 0; color: #1a1a1a;">Share your experience</h3>
                    <p style="font-size: 0.9rem; color: #666; margin: 5px 0 0 0;">Your feedback helps us grow and helps others choose.</p>
                </div>
            </div>
            
            <form class="review-form" data-product-id="${productId}">
                <div style="display: flex; flex-direction: column; gap: 25px;">
                    <div>
                        <label style="display: block; font-size: 0.9rem; font-weight: 700; color: #444; margin-bottom: 12px;">Overall Rating</label>
                        <div class="star-rating-input" style="font-size: 28px; display: flex; gap: 8px; border: none; background: transparent; cursor: pointer;">
                            <span class="star" data-rating="1" style="color: #fa873b;">★</span>
                            <span class="star" data-rating="2" style="color: #fa873b;">★</span>
                            <span class="star" data-rating="3" style="color: #fa873b;">★</span>
                            <span class="star" data-rating="4" style="color: #fa873b;">★</span>
                            <span class="star" data-rating="5" style="color: #fa873b;">★</span>
                        </div>
                        <input type="hidden" name="rating" value="5">
                    </div>

                    <div style="position: relative;">
                        <label style="display: block; font-size: 0.9rem; font-weight: 700; color: #444; margin-bottom: 12px;">Your Review</label>
                        <textarea name="comment" class="review-textarea" 
                            style="width: 100%; min-height: 120px; padding: 15px 20px; background: #f9f9f9; border: 1.5px solid #eee; border-radius: 15px; font-size: 1rem; transition: all 0.3s ease; resize: vertical;" 
                            placeholder="Tell us what you liked about this product..." required></textarea>
                    </div>

                    <div style="display: flex; justify-content: flex-end;">
                        <button type="submit" class="btn-premium btn-primary" style="padding: 15px 40px; font-size: 1rem; border-radius: 12px; height: auto; box-shadow: 0 5px 15px rgba(250, 135, 59, 0.3);">
                            Post Review <i class="bi bi-send-fill" style="margin-left: 8px;"></i>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    `;
}

// Create reviews display HTML (Premium Grid)
async function createReviewsDisplay(targetId, type = 'product') {
    const allReviews = await reviewSystem.getReviews(targetId, type);
    const reviews = allReviews
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6);
    
    const avgRating = reviewSystem.getAverageRating(allReviews);

    let html = `
        <div class="reviews-container-premium">
            <div style="display: grid; grid-template-columns: 320px 1fr; gap: 40px; align-items: start; margin-bottom: 50px;">
                <!-- Left: Rating Summary -->
                <div style="background: white; padding: 35px; border-radius: 24px; box-shadow: 0 10px 35px rgba(0,0,0,0.04); text-align: center; border: 1px solid #f0f0f0;">
                    <div style="font-size: 4rem; font-weight: 900; color: #1a1a1a; line-height: 1; margin-bottom: 15px;">${avgRating}</div>
                    <div style="color: #fa873b; font-size: 1.5rem; margin-bottom: 10px;">${renderStars(avgRating)}</div>
                    <div style="font-size: 1rem; color: #666; font-weight: 600;">Based on ${allReviews.length} Reviews</div>
                    
                    <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 25px; text-align: left;">
                        <h4 style="font-size: 0.95rem; font-weight: 800; color: #1a1a1a; margin-bottom: 15px;">Rating Distribution</h4>
                        ${[5, 4, 3, 2, 1].map(stars => {
                            const count = allReviews.filter(r => Math.round(r.rating) === stars).length;
                            const percentage = allReviews.length > 0 ? (count / allReviews.length) * 100 : 0;
                            return `
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                    <span style="font-size: 0.85rem; font-weight: 700; color: #666; width: 15px;">${stars}</span>
                                    <div style="flex: 1; height: 6px; background: #f0f0f0; border-radius: 10px; overflow: hidden;">
                                        <div style="width: ${percentage}%; height: 100%; background: #fa873b; border-radius: 10px;"></div>
                                    </div>
                                    <span style="font-size: 0.85rem; font-weight: 600; color: #999; width: 30px;">${count}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Right: Latest Reviews -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #f8f8f8;">
                        <h3 style="font-size: 1.4rem; font-weight: 800; color: #1a1a1a;">Latest Feedback</h3>
                        <div style="font-size: 0.9rem; color: #fa873b; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                            View All <i class="bi bi-arrow-right"></i>
                        </div>
                    </div>
    `;

    if (reviews.length === 0) {
        html += `
            <div style="padding: 60px 20px; text-align: center; background: #fff; border-radius: 20px; border: 2px dashed #eee;">
                <i class="bi bi-chat-heart" style="font-size: 3rem; color: #ddd; display: block; margin-bottom: 15px;"></i>
                <p style="color: #999; font-size: 1.1rem; font-style: italic;">No reviews yet. Be the first to share your experience!</p>
            </div>
        `;
    } else {
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">`;
        reviews.forEach(review => {
            html += `
                <div class="minimal-review" style="background: #fff; padding: 25px; border-radius: 20px; border: 1px solid #f0f0f0; transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(0,0,0,0.02);">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                        <div class="minimal-avatar" style="width: 40px; height: 40px; background: #fff5ed; color: #fa873b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; border: 1px solid #fa873b22;">
                            ${review.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: 800; font-size: 1rem; color: #1a1a1a;">${review.userName}</div>
                            <div style="color: #fa873b; font-size: 0.8rem;">${renderStars(review.rating)}</div>
                        </div>
                    </div>
                    <p style="font-size: 0.95rem; color: #555; line-height: 1.6; margin: 0; font-style: italic;">"${review.comment}"</p>
                    <div style="margin-top: 15px; font-size: 0.8rem; color: #bbb; display: flex; align-items: center; gap: 5px;">
                        <i class="bi bi-check-circle-fill" style="color: #2ecc71;"></i> Verified Purchase
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `
                </div>
            </div>
        </div>
    `;
    return html;
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let stars = '';
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) stars += '★';
        else if (i === fullStars && halfStar) stars += '★';
        else stars += '<span style="color: #e0e0e0;">★</span>';
    }
    return stars;
}

function getUserId() {
    const user = JSON.parse(localStorage.getItem('vitthal_user'));
    return user ? (user._id || user.id) : null;
}

// Initialize reviews on page (for products)
async function initializeReviews(productId) {
    return initializeGenericReviews(productId, 'product');
}

// Initialize reviews on page (for generic pages)
async function initializePageReviews(pageName) {
    return initializeGenericReviews(pageName, 'page');
}

// Internal generic initializer
async function initializeGenericReviews(targetId, type = 'product') {
    const reviewsContainer = document.getElementById('reviews-section');
    if (!reviewsContainer) return;

    const isPage = type === 'page';

    // Loading state
    reviewsContainer.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="bi bi-arrow-clockwise" style="font-size: 2rem; color: #fa873b; animation: spin 1s linear infinite;"></i></div>';

    // Render exiting reviews first (One-line strip)
    const reviewsHtml = await createReviewsDisplay(targetId, type);
    
    // Render form below
    const formHtml = createReviewForm(targetId);
    
    reviewsContainer.innerHTML = reviewsHtml + formHtml;

    // Form submission
    const form = reviewsContainer.querySelector('.review-form');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const rating = this.querySelector('input[name="rating"]').value;
            const comment = this.querySelector('textarea[name="comment"]').value;

            if (comment.trim().length < 10) {
                alert('Please write at least 10 characters in your review');
                return;
            }

            const result = await reviewSystem.addReview(targetId, rating, comment, isPage);
            if (result) {
                form.reset();
                initializeGenericReviews(targetId, type);
            }
        });
    }

    // Star rating input logic
    const stars = reviewsContainer.querySelectorAll('.star-rating-input .star');
    stars.forEach(star => {
        star.addEventListener('click', function () {
            const rating = this.dataset.rating;
            this.closest('form').querySelector('input[name="rating"]').value = rating;

            stars.forEach(s => {
                s.classList.toggle('active', s.dataset.rating <= rating);
            });
        });

        star.addEventListener('mouseover', function () {
            const rating = this.dataset.rating;
            stars.forEach(s => {
                s.style.color = s.dataset.rating <= rating ? '#fa873b' : '#e0e0e0';
            });
        });
        
        star.addEventListener('mouseout', function () {
            const currentRating = this.closest('form').querySelector('input[name="rating"]').value;
            stars.forEach(s => {
                s.style.color = s.dataset.rating <= currentRating ? '#fa873b' : '#e0e0e0';
            });
        });
    });
}
