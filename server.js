const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envResult = dotenv.config({ path: envPath });
  if (envResult.error) {
    console.warn(`❌ dotenv could not load ${envPath}:`, envResult.error.message);
  } else {
    console.log(`✅ dotenv loaded ${Object.keys(envResult.parsed || {}).length} vars from ${envPath}`);
  }
} else {
  if (process.env.NODE_ENV === 'production') {
    console.log(`ℹ️ dotenv .env file not found at ${envPath}. Production env vars are expected to be set externally.`);
  } else {
    console.warn(`⚠️ dotenv .env file not found at ${envPath}. Falling back to existing environment variables.`);
  }
}

const express = require('express');
const crypto = require('crypto');
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

const isProduction = process.env.NODE_ENV === 'production';

const normalizeOrigin = (origin) => {
  try {
    return new URL(origin).origin.toLowerCase();
  } catch {
    return origin ? origin.trim().toLowerCase() : '';
  }
};

const rawAllowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://vitthalphotos.com,https://www.vitthalphotos.com')
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

const defaultAllowedOrigins = [
  'https://vitthalphotos.com',
  'https://www.vitthalphotos.com'
].map(normalizeOrigin);

const allowedOrigins = Array.from(new Set([...rawAllowedOrigins, ...defaultAllowedOrigins]));
const allowedOriginHostSuffixes = ['.hostingersite.com'];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalizedOrigin = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalizedOrigin)) return true;
  if (normalizedOrigin.startsWith('http://localhost')) return true;
  if (normalizedOrigin.startsWith('http://127.0.0.1')) return true;
  if (normalizedOrigin.startsWith('https://localhost')) return true;
  if (normalizedOrigin.startsWith('https://127.0.0.1')) return true;
  if (allowedOriginHostSuffixes.some((suffix) => normalizedOrigin.endsWith(suffix))) return true;
  return false;
};

// Security middleware
const { 
  securityHeaders, 
  authLimiter, 
  apiLimiter, 
  paymentLimiter, 
  uploadLimiter, 
  sanitizeInputs, 
  secureHeaders,
  csrfProtection,
  issueCsrfToken
} = require('./middleware/securityMiddleware');

const app = express();
app.disable('x-powered-by');

// Validate critical environment variables
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV && process.env.NODE_ENV === 'production') {
    console.error('❌ FATAL: JWT_SECRET is not set in environment variables.');
    console.error('Set JWT_SECRET in your production environment and restart the process.');
    process.exit(1);
  } else {
    // Development fallback: generate a temporary secret so local dev doesn't break
    const tempSecret = crypto.randomBytes(32).toString('hex');
    process.env.JWT_SECRET = tempSecret;
    console.warn('⚠️  WARNING: JWT_SECRET was not set. Using a temporary development secret.');
  }
}

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
app.use((req, res, next) => {
  if (req.path && /[\u0000-\u001f]/.test(req.path)) {
    return res.status(400).json({ message: 'Invalid request path' });
  }
  next();
});

// CORS - Restrictive configuration with origin normalization
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    console.warn('❌ CORS rejection:', origin);
    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

// Body parser with size limits
app.use(express.json({ limit: '10mb', strict: true }));
app.use(express.urlencoded({ limit: '10mb', extended: true, parameterLimit: 1000 }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (req.cookies && req.cookies.session) {
    res.cookie('session', req.cookies.session, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
  }
  next();
});

// Apply sanitization to all requests
app.use(sanitizeInputs);

// Apply general rate limiting
app.use('/api/', apiLimiter);

// Lightweight CSRF protection for state-changing requests
app.use(csrfProtection);

app.get('/api/csrf-token', issueCsrfToken);

// Check DB connectivity for API routes
app.use('/api/', dbRequiredMiddleware);

// API routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentLimiter, paymentRoutes); // Strict rate limit on payments
app.use('/api/upload', uploadLimiter, uploadRoutes);
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

// SPA fallback – serve index.html for all non-API routes, but do not rewrite asset or upload paths
app.get('*path', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  const reservedPrefixes = ['/assets', '/uploads', '/favicon.svg', '/icons.svg', '/robots.txt', '/sitemap.xml', '/manifest.json'];
  const isReservedPath = reservedPrefixes.some((prefix) => {
    return req.path === prefix || req.path.startsWith(`${prefix}/`);
  });

  if (isReservedPath) {
    return res.status(404).send('Not found');
  }

  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
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
