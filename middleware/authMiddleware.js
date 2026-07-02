const jwt = require('jsonwebtoken');
const { User } = require('../lib/db');

const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization || '';
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);

  if (bearerMatch) {
    try {
      token = bearerMatch[1];

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error('CRITICAL: JWT_SECRET not set in environment variables');
        return res.status(500).json({ message: 'Server configuration error' });
      }

      const decoded = jwt.verify(token, secret, {
        algorithms: ['HS256'],
        issuer: 'vitthal-photo-frames',
        audience: 'web-client',
      });

      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Map to plain object and ensure _id exists as a string
      req.user = { ...user.toObject(), _id: user._id.toString() };

      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
