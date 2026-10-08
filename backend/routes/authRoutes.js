// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

// Import authentication controllers
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile
} = require('../controllers/authController');

// Import JWT protection middleware filter
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Create a new student profile
 * @access  Public
 */
router.post('/register', registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Verify credentials and issue access token
 * @access  Public
 */
router.post('/login', loginUser);

/**
 * @route   GET /api/auth/profile
 * @desc    Retrieve details for the logged-in user session
 * @access  Private (Requires Bearer token verification)
 */
router.get('/profile', protect, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update details for the logged-in user session
 * @access  Private (Requires Bearer token verification)
 */
router.put('/profile', protect, updateProfile);

module.exports = router;
