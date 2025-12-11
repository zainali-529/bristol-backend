const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Middleware to verify JWT token
const auth = (req, res, next) => {
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

// Middleware to check if user is developer
const developerAuth = (req, res, next) => {
  if (req.user && req.user.role === 'developer') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Developer privileges required.' });
  }
};

module.exports = { auth, adminAuth, developerAuth };
