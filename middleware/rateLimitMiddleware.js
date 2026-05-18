const rateLimit = {};

/**
 * Custom memory-based rate limiting middleware
 * @param {number} limit - Maximum number of requests allowed in the time window
 * @param {number} windowMs - Time window in milliseconds (default: 15 minutes)
 */
const rateLimiter = (limit = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    
    if (!rateLimit[ip]) {
      rateLimit[ip] = [];
    }
    
    // Clean up timestamps older than the time window
    rateLimit[ip] = rateLimit[ip].filter(timestamp => now - timestamp < windowMs);
    
    if (rateLimit[ip].length >= limit) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${ip} on route: ${req.originalUrl}`);
      return res.status(429).json({
        message: 'Too many requests from this IP, please try again later.'
      });
    }
    
    rateLimit[ip].push(now);
    next();
  };
};

module.exports = rateLimiter;
