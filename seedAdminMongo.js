const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'admin@vitthal.com';
        const password = 'admin123';

        const adminExists = await User.findOne({ email });

        if (adminExists) {
            console.log('Admin already exists in MongoDB:', email);
            process.exit();
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            name: 'System Admin',
            email: email,
            password: hashedPassword,
            isAdmin: true
        });

        console.log('✅ Admin User Created in MongoDB Successfully!');
        console.log('Email:', email);
        console.log('Password:', password);
        process.exit();
    } catch (error) {
        console.error('❌ Error seeding admin in MongoDB:', error.message);
        process.exit(1);
    }
};

seedAdmin();
