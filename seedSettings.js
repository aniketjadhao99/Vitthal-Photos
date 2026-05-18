const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Settings = require('./models/Settings');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedSettings = async () => {
    try {
        await Settings.deleteMany();

        await Settings.create({
            siteName: 'Vitthal Photo Frames',
            logoUrl: '/assets/images/logo.png', // Default placeholder
            contactEmail: 'vitthalphotos99@gmail.com',
            contactPhone: '+91 9876543210',
            address: 'Pandharpur, Maharashtra, India',
            socialLinks: {
                instagram: 'https://instagram.com/vitthal_photos',
                facebook: 'https://facebook.com/vitthal_photos',
                twitter: 'https://twitter.com/vitthal_photos'
            }
        });

        console.log('Settings Seeded!');
        process.exit();
    } catch (error) {
        console.error('Error seeding settings:', error);
        process.exit(1);
    }
};

seedSettings();
