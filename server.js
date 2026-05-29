require('dotenv').config();
const express = require('express');
const path = require('path');
const { connectDB } = require('./lib/db');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const userRoutes = require('./routes/userRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const couponRoutes = require('./routes/couponRoutes');
const addressRoutes = require('./routes/addressRoutes');
const returnRoutes = require('./routes/returnRoutes');
const contactRoutes = require('./routes/contactRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const seoRoutes = require('./routes/seoRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Security middleware
const { 
  securityHeaders, 
  authLimiter, 
  apiLimiter, 
  paymentLimiter, 
  sanitizeInputs, 
  secureHeaders 
} = require('./middleware/securityMiddleware');

const app = express();

// Trust proxy when running behind a reverse proxy/load balancer
// This is required for rate-limiters and secure cookies to work correctly
app.set('trust proxy', 1);

// Global variable to track DB connection status
let dbConnected = false;

// Health check endpoint (always return 200) - helps load balancers and uptime monitors
app.get('/healthz', (req, res) => res.sendStatus(200));

// Initialize database connection (non-blocking - server continues even if DB fails)
(async () => {
  console.log('🚀 Starting server initialization...');
  try {
    const connected = await connectDB();
    dbConnected = connected;
    if (connected) {
      console.log('✅ Database ready for operations');
    } else {
      console.warn('⚠️  Server running in degraded mode - database unavailable');
      console.warn('   API endpoints will return 503 until database is fixed');
    }
  } catch (error) {
    console.error('❌ Unexpected error during DB initialization:', error);
    console.warn('⚠️  Server running in degraded mode');
  }
})();

// Middleware to check DB connectivity for API routes
const dbRequiredMiddleware = (req, res, next) => {
  if (!dbConnected && !req.path.startsWith('/healthz')) {
    return res.status(503).json({ 
      message: 'Service temporarily unavailable',
      reason: 'Database connection failed',
      help: 'Please check your MongoDB credentials in .env file'
    });
  }
  next();
};

// Apply security headers first
app.use(securityHeaders);
app.use(secureHeaders);

// CORS - Restrictive configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://vitthalphotos.com', 'https://www.vitthalphotos.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser with size limits
app.use(express.json({ limit: '10mb' })); // Reduced from 50mb
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Apply sanitization to all requests
app.use(sanitizeInputs);

// Apply general rate limiting
app.use('/api/', apiLimiter);

// Check DB connectivity for API routes
app.use('/api/', dbRequiredMiddleware);

// API routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentLimiter, paymentRoutes); // Strict rate limit on payments
app.use('/api/upload', uploadRoutes);
app.use('/api/users', authLimiter, userRoutes); // Strict rate limit on auth
app.use('/api/settings', settingsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/seo', seoRoutes);

// SEO - Public sitemap and robots.txt
app.get('/sitemap.xml', (req, res) => {
  res.redirect('/api/seo/sitemap.xml');
});
app.get('/robots.txt', (req, res) => {
  res.redirect('/api/seo/robots.txt');
});

// Serve local upload files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static frontend files (React build)
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// SPA fallback – serve index.html for all non-API routes
app.get('*path', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
  }
});


// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  console.error(err.stack);
  const payload = { message: 'Internal Server Error' };
  if (process.env.NODE_ENV === 'development') payload.error = err.message;
  res.status(500).json(payload);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
