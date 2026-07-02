const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Not authorized as an admin' });
  }
  next();
};

module.exports = { requireAdmin };
