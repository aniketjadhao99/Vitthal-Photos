const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const testFetch = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        const products = await Product.find({});
        console.log(`Found ${products.length} products`);
        if (products.length > 0) {
            console.log('First product:', products[0]);
        }
        process.exit(0);
    } catch (error) {
        console.error('Test Fetch Error:', error);
        process.exit(1);
    }
};

testFetch();
