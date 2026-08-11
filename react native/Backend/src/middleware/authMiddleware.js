const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes & verify JWT Bearer Token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (Format: "Bearer <TOKEN>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token with secret key
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecretkey'
      );

      // Fetch user from database excluding password field
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found, token invalid' });
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res
        .status(401)
        .json({ message: 'Not authorized, token verification failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
