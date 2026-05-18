const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get all reviews (for admin)
// @route   GET /api/reviews
// @access  Private - Admin only
router.get('/', protect, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized as an admin' });
    }
    try {
        const reviews = await prisma.review.findMany({
            orderBy: { createdAt: 'desc' }
        });
        const mappedReviews = reviews.map(r => ({ ...r, _id: r.id }));
        res.json(mappedReviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
});

// @desc    Get reviews for a product or page
// @route   GET /api/reviews/:targetId
router.get('/:targetId', async (req, res) => {
    try {
        const { targetId } = req.params;
        const { type } = req.query; // 'product' or 'page'

        let where = {};
        if (type === 'page') {
            where.pageName = targetId;
        } else {
            where.productId = targetId;
        }

        const reviews = await prisma.review.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        const mappedReviews = reviews.map(r => ({ ...r, _id: r.id }));
        res.json(mappedReviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
});

// @desc    Add a new review
// @route   POST /api/reviews
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { rating, comment, productId, pageName } = req.body;

        if (!productId && !pageName) {
            return res.status(400).json({ message: 'Product ID or Page Name is required' });
        }

        const review = await prisma.review.create({
            data: {
                userId: req.user._id,
                userName: req.user.name,
                rating: Number(rating),
                comment,
                productId: productId || null,
                pageName: pageName || null,
                helpfulBy: []
            }
        });

        res.status(201).json({ ...review, _id: review.id });
    } catch (error) {
        console.error('Review error:', error);
        res.status(500).json({ message: 'Error submitting review', error: error.message });
    }
});

// @desc    Mark a review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
router.post('/:id/helpful', protect, async (req, res) => {
    try {
        const review = await prisma.review.findUnique({
            where: { id: req.params.id }
        });

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        let helpfulBy = [];
        try {
            helpfulBy = Array.isArray(review.helpfulBy) ? review.helpfulBy : JSON.parse(review.helpfulBy || '[]');
        } catch (e) {
            helpfulBy = [];
        }

        const userId = req.user._id;
        const index = helpfulBy.indexOf(userId);

        if (index > -1) {
            helpfulBy.splice(index, 1);
        } else {
            helpfulBy.push(userId);
        }

        const updatedReview = await prisma.review.update({
            where: { id: req.params.id },
            data: { helpfulBy }
        });

        res.json({ ...updatedReview, _id: updatedReview.id });
    } catch (error) {
        res.status(500).json({ message: 'Error updating helpful status', error: error.message });
    }
});

module.exports = router;
