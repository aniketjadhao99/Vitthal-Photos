const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// @desc    Get site settings
// @route   GET /api/settings
router.get('/', async (req, res) => {
    try {
        let settings = await prisma.settings.findFirst();
        if (!settings) {
            settings = await prisma.settings.create({ data: {} });
        }
        res.json({ ...settings, _id: settings.id });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update site settings
// @route   PUT /api/settings
router.put('/', async (req, res) => {
    try {
        let settings = await prisma.settings.findFirst();
        
        if (settings) {
            const updatedSettings = await prisma.settings.update({
                where: { id: settings.id },
                data: {
                    siteName: req.body.siteName || undefined,
                    logoUrl: req.body.logoUrl || undefined,
                    contactEmail: req.body.contactEmail || undefined,
                    contactPhone: req.body.contactPhone || undefined,
                    address: req.body.address || undefined,
                    socialLinks: req.body.socialLinks || undefined,
                    razorpayKeyId: req.body.razorpayKeyId || undefined,
                    razorpayKeySecret: req.body.razorpayKeySecret || undefined,
                }
            });
            res.json({ ...updatedSettings, _id: updatedSettings.id });
        } else {
            const newSettings = await prisma.settings.create({
                data: req.body
            });
            res.status(201).json({ ...newSettings, _id: newSettings.id });
        }
    } catch (error) {
        console.error('Settings update error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
}

module.exports = router;
