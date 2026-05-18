const prisma = require('./lib/prisma');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const seedAdmin = async () => {
    try {
        const email = 'admin@vitthal.com';
        const password = 'admin123';

        // Check if admin already exists
        const adminExists = await prisma.user.findUnique({ where: { email } });

        if (adminExists) {
            console.log('Admin already exists with email:', email);
            process.exit();
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                name: 'System Admin',
                email: email,
                password: hashedPassword,
                isAdmin: true
            }
        });

        console.log('✅ Admin User Created Successfully!');
        console.log('Email:', email);
        console.log('Password:', password);
        process.exit();
    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
        process.exit(1);
    }
};

seedAdmin();
