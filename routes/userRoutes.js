const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { protect } = require('../middleware/authMiddleware');
const {
    registerUser,
    authUser,
    updateUserProfile,
    updateUserPassword,
    forgotPassword,
    verifyOTP,
    resetPassword,
    googleAuth,
    requestOTP,
    verifyOTPLogin
} = require('../controllers/userController');

const { User } = require('../lib/db');

// @desc    Get all users (Admin only)
router.get('/', protect, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }
        const users = await User.find().select('_id name email isAdmin createdAt');
        const mappedUsers = users.map(u => ({ ...u.toObject(), _id: u._id.toString() }));
        res.json(mappedUsers);
    } catch (error) {
        console.error('Fetch all users error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

const rateLimiter = require('../middleware/rateLimitMiddleware');

const authLimiter = rateLimiter(10, 15 * 60 * 1000); // 10 requests per 15 min
const forgotLimiter = rateLimiter(5, 15 * 60 * 1000); // 5 requests per 15 min

router.post('/', authLimiter, registerUser);
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, authUser);
router.put('/profile', protect, updateUserProfile);
router.put('/profile/password', protect, updateUserPassword);
router.post('/forgot-password', forgotLimiter, forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/login-request-otp', requestOTP);
router.post('/login-verify-otp', verifyOTPLogin);
router.post('/google-auth', googleAuth);

// @desc    Delete user (Admin only)
router.delete('/:id', protect, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }
        await prisma.user.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'User removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;

