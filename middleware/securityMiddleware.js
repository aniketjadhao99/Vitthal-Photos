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
      // Disallow unsafe-inline to strengthen CSP. Inline scripts/styles
      // should be replaced with hashed nonces where required.
      // Allow secure external resources (CDNs, Google Fonts, S3) but disallow inline.
      scriptSrc: ["'self'", 'https:'],
      // Allow inline styles for compatibility (consider removing after refactor)
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
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
  const MAX_STR_LEN = 1000;

  const sanitizeValue = (val, key) => {
    if (typeof val === 'string') {
      // Lightweight sanitizer: remove MongoDB operator chars and basic HTML chars
      let cleaned = String(val);
      // Preserve typical user fields like email; only strip dangerous chars for others
      if (!(key && String(key).toLowerCase() === 'email')) {
        cleaned = cleaned.replace(/\$/g, '');
      }
      cleaned = cleaned.replace(/[<>\"'`]/g, '').trim();
      if (cleaned.length > MAX_STR_LEN) cleaned = cleaned.substring(0, MAX_STR_LEN);
      return cleaned;
    }
    if (Array.isArray(val)) return val.map(sanitizeValue);
    if (val && typeof val === 'object') return sanitizeObject(val);
    return val;
  };

  const sanitizeObject = (obj) => {
    const out = Array.isArray(obj) ? [] : {};
    for (const k in obj) {
      try {
        out[k] = sanitizeValue(obj[k], k);
      } catch (e) {
        out[k] = undefined;
      }
    }
    return out;
  };

  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
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
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https:; style-src 'self' https: 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https: data:");
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
