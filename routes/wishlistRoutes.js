const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user._id },
            include: { wishlist: true }
        });
        
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Map id to _id for frontend compatibility
        const mappedWishlist = user.wishlist.map(p => ({ ...p, _id: p.id }));
        res.json(mappedWishlist);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { productId } = req.body;
        
        await prisma.user.update({
            where: { id: req.user._id },
            data: {
                wishlist: {
                    connect: { id: productId }
                }
            }
        });

        res.status(201).json({ message: 'Added to wishlist' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
router.delete('/:productId', protect, async (req, res) => {
    try {
        await prisma.user.update({
            where: { id: req.user._id },
            data: {
                wishlist: {
                    disconnect: { id: req.params.productId }
                }
            }
        });
        res.json({ message: 'Removed from wishlist' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Check if product is in wishlist
// @route   GET /api/wishlist/check/:productId
// @access  Private
router.get('/check/:productId', protect, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user._id },
            include: { 
                wishlist: {
                    where: { id: req.params.productId }
                }
            }
        });
        
        const inWishlist = user && user.wishlist.length > 0;
        res.json({ inWishlist });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
