const helmet = require('helmet');
const mongoSanitize = require('mongo-sanitize');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

// 1. Helmet - Security Headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// 2. Rate Limiting - Auth endpoints (strict)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Skip for non-auth endpoints
    return !req.path.includes('/register') && !req.path.includes('/login') && !req.path.includes('/forgot-password');
  },
});

// 3. Rate Limiting - General API (moderate)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Rate Limiting - Payment endpoints (very strict)
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment attempts per hour
  message: 'Too many payment attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// 5. Data Sanitization - Clean all inputs
const sanitizeInputs = (req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Remove MongoDB operators
        req.body[key] = mongoSanitize.sanitize(req.body[key]);
        // Remove HTML/XSS attempts
        req.body[key] = req.body[key]
          .replace(/[<>\"'`]/g, '')
          .trim();
      }
    }
  }
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = mongoSanitize.sanitize(req.query[key]);
        req.query[key] = req.query[key]
          .replace(/[<>\"'`]/g, '')
          .trim();
      }
    }
  }
  if (req.params) {
    for (const key in req.params) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = mongoSanitize.sanitize(req.params[key]);
        req.params[key] = req.params[key]
          .replace(/[<>\"'`]/g, '')
          .trim();
      }
    }
  }
  next();
};

// 6. CSRF Protection
const csrfProtection = csrf({ cookie: false });

// 7. Security middleware to apply on specific routes
const secureHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

module.exports = {
  securityHeaders,
  authLimiter,
  apiLimiter,
  paymentLimiter,
  sanitizeInputs,
  csrfProtection,
  secureHeaders,
};
