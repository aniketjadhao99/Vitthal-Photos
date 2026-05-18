const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    siteName: { type: String, default: 'Vitthal Photo Frames' },
    logoUrl: { type: String, default: '/assets/images/logo.png' },
    contactEmail: { type: String, default: 'vitthalphotos99@gmail.com' },
    contactPhone: { type: String, default: '+91 9876543210' },
    address: { type: String, default: 'Pandharpur, Maharashtra, India' },
    socialLinks: {
        instagram: String,
        facebook: String,
        twitter: String
    }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;
