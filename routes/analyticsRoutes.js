const express = require('express');
const router = express.Router();
const { Order, User, Product } = require('../lib/db');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get dashboard overview statistics
// @route   GET /api/analytics/overview
// @access  Private/Admin
router.get('/overview', protect, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Not authorized' });

  try {
    const [totalOrders, totalRevenueData, totalCustomers, lowStockProducts] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
      User.countDocuments({ isAdmin: false }),
      Product.find({ stock: { $lt: 5 } }).select('_id name stock').limit(5)
    ]);

    const totalRevenue = totalRevenueData.length > 0 ? totalRevenueData[0].total : 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      totalOrders,
      totalRevenue,
      averageOrderValue: avgOrderValue,
      totalCustomers,
      lowStockCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts.map(p => ({ id: p._id.toString(), name: p.name, stock: p.stock, lowStockThreshold: 5 }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get sales trends (last 30 days)
// @route   GET /api/analytics/sales-trend
// @access  Private/Admin
router.get('/sales-trend', protect, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Not authorized' });

  try {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const orders = await Order.find({ createdAt: { $gte: last30Days } }).select('createdAt totalPrice');

    // Group by date
    const trend = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!trend[date]) trend[date] = { revenue: 0, count: 0 };
      trend[date].revenue += order.totalPrice;
      trend[date].count += 1;
    });

    const chartData = Object.entries(trend).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.count
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ data: chartData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get orders by status
// @route   GET /api/analytics/order-status
// @access  Private/Admin
router.get('/order-status', protect, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Not authorized' });

  try {
    const statusCount = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const data = statusCount.map(item => ({
      status: item._id,
      count: item.count
    }));

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get top selling products
// @route   GET /api/analytics/top-products
// @access  Private/Admin
router.get('/top-products', protect, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Not authorized' });

  try {
    const topProducts = await Product.find().sort({ salesCount: -1 }).limit(10).select('_id name salesCount basePrice');

    res.json({ data: topProducts.map(p => ({ id: p._id.toString(), name: p.name, salesCount: p.salesCount, basePrice: p.basePrice })) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get revenue by category
// @route   GET /api/analytics/revenue-category
// @access  Private/Admin
router.get('/revenue-category', protect, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Not authorized' });

  try {
    const categories = await Product.aggregate([
      { $group: { _id: '$category', salesCount: { $sum: '$salesCount' } } }
    ]);

    const data = categories.map(cat => ({
      category: cat._id || 'Uncategorized',
      sales: cat.salesCount || 0
    }));

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
