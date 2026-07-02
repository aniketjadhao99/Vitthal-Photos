const crypto = require('crypto');
const helmet = require('helmet');
const mongoSanitize = require('mongo-sanitize');
const rateLimit = require('express-rate-limit');

// 1. Helmet - Security Headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      scriptSrc: ["'self'", 'https:', "'unsafe-inline'"],
      frameSrc: ["'self'", 'https:', 'https://checkout.razorpay.com', 'https://api.razorpay.com'],
      childSrc: ["'self'", 'https:', 'https://checkout.razorpay.com', 'https://api.razorpay.com'],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  hidePoweredBy: true,
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

// 5. Rate Limiting - Upload endpoints
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many uploads, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// 6. Data Sanitization - Clean all inputs
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
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = mongoSanitize(obj);
    const out = Array.isArray(sanitized) ? [] : {};
    for (const k in sanitized) {
      try {
        out[k] = sanitizeValue(sanitized[k], k);
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

// 7. Security middleware to apply on specific routes
const secureHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Content-Security-Policy', "default-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; script-src 'self' https: 'unsafe-inline'; style-src 'self' https: 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https: data:; frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com; child-src 'self' https://checkout.razorpay.com https://api.razorpay.com;");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
};

// 8. Lightweight CSRF protection for unsafe requests
const isSameOriginRequest = (req) => {
  const origin = req.get('origin');
  const referer = req.get('referer');
  const host = req.get('host');
  const expectedOrigin = `${req.protocol}://${host}`;

  if (!origin && !referer) return true;

  try {
    if (origin && new URL(origin).origin !== expectedOrigin) return false;
    if (referer) {
      const refererUrl = new URL(referer);
      if (refererUrl.origin !== expectedOrigin) return false;
    }
  } catch (error) {
    return false;
  }

  return true;
};

const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  if (/^Bearer\s+/.test(authHeader)) {
    return next();
  }

  if (isSameOriginRequest(req)) {
    return next();
  }

  const suppliedToken = req.get('x-csrf-token') || req.body?.csrfToken || req.query?.csrfToken || req.cookies?.csrfToken;
  const cookieToken = req.cookies?.csrfToken;

  if (suppliedToken && cookieToken && suppliedToken === cookieToken) {
    return next();
  }

  return res.status(403).json({ message: 'Invalid or missing CSRF token' });
};

const issueCsrfToken = (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrfToken', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24,
  });
  res.json({ csrfToken: token });
};

module.exports = {
  securityHeaders,
  authLimiter,
  apiLimiter,
  paymentLimiter,
  uploadLimiter,
  sanitizeInputs,
  secureHeaders,
  csrfProtection,
  issueCsrfToken,
};
