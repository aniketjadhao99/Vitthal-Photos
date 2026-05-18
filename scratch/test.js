require('dotenv').config();
const { connectDB, Order, User, Product } = require('../lib/db');

async function run() {
  await connectDB();
  try {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trendOrders = await Order.find({ createdAt: { $gte: last30Days } }).select('createdAt totalPrice');
    const statusCount = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const topProducts = await Product.find().sort({ salesCount: -1 }).limit(10).select('_id name salesCount basePrice');
    const categories = await Product.aggregate([{ $group: { _id: '$category', salesCount: { $sum: '$salesCount' } } }]);

    console.log("TREND:", trendOrders.length);
    console.log("STATUS:", statusCount);
    console.log("TOP PRODUCTS:", topProducts.length);
    console.log("CATEGORIES:", categories);
  } catch (e) {
    console.error("FAILED", e);
  }
  process.exit();
}
run();
