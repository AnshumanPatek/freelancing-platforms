const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Protect routes
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      return res.json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401);
    return res.json({ message: 'Not authorized, no token' });
  }
};

// Check if user is employer
const employerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'employer') {
    next();
  } else {
    res.status(403);
    return res.json({ message: 'Not authorized, employer only' });
  }
};

// Check if user is freelancer
const freelancerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'freelancer') {
    next();
  } else {
    res.status(403);
    return res.json({ message: 'Not authorized, freelancer only' });
  }
};

module.exports = { protect, employerOnly, freelancerOnly }; 