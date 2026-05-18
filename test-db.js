require('dotenv').config();
const mongoose = require('mongoose');

const testConn = async () => {
    try {
        console.log('Testing connection to:', process.env.MONGO_URI);
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('Successfully connected to:', conn.connection.host);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        
        for (const coll of collections) {
            const count = await mongoose.connection.db.collection(coll.name).countDocuments();
            console.log(`- ${coll.name}: ${count} documents`);
        }
        process.exit(0);
    } catch (err) {
        console.error('Connection failed!');
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        if (err.reason) {
            console.error('Reason:', err.reason);
        }
        process.exit(1);
    }
};

testConn();
