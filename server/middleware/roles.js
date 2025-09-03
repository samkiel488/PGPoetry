// Simple helper middleware to check roles (alternative to requireRole factory)
module.exports = {
  isAdmin: (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    next();
  }
};
