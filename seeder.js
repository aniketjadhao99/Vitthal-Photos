const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); 
const Product = require('./models/Product'); 
const products = require('./data/products'); 

dotenv.config();
connectDB();

const importData = async () => {
  try {
    
    await Product.deleteMany();

   
    await Product.insertMany(products);

    console.log('✅ Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

importData();