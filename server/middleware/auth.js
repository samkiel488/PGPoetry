const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Auth middleware: verifies access token and attaches full user (without sensitive fields) to req.user
const auth = async (req, res, next) => {
  try {
    const header = req.header('Authorization') || '';
    const token = header.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Handle admin user (mock user with string ID)
    if (decoded.id === 'admin-user') {
      req.user = {
        _id: 'admin-user',
        username: decoded.username || 'admin',
        role: 'admin'
      };
      return next();
    }

    // Handle regular users with MongoDB ObjectId
    const user = await User.findById(decoded.id).select('-password -refreshToken').lean();
    if (!user) return res.status(401).json({ message: 'Invalid token.' });

    req.user = user;
    next();
  } catch (error) {
    console.error('auth middleware error', error && error.message);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Role middleware factory: use requireRole('admin') to protect admin-only routes
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

module.exports = auth;
module.exports.requireRole = requireRole;