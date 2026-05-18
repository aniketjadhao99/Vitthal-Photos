require('dotenv').config();
const mongoose = require('mongoose');

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await mongoose.connection.db.collection('users').find({ isAdmin: true }).toArray();
        console.log('Admin users in MongoDB:');
        users.forEach(u => console.log(`- Email: ${u.email}`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUsers();
