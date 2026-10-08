// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Route protection middleware to authenticate users using JWT bearer tokens.
 * Intercepts requests, validates token signatures, and sets user context.
 */
const protect = async (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token string from Bearer format: "Bearer <token_value>"
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify token signature using the secret key from environment
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user profile from database by ID, omitting the hashed password field
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user profile not found'
        });
      }

      // Continue to next middleware or route controller function
      return next();
    } catch (error) {
      console.error(`Token authentication error: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token validation failed'
      });
    }
  }

  // If no token was found in request headers
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, session token is missing'
    });
  }
};

module.exports = { protect };
