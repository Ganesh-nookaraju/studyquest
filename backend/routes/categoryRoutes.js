// backend/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();

// Import category controller
const { getCategories } = require('../controllers/categoryController');

/**
 * @route   GET /api/categories
 * @desc    Get all categories for supplemental subjects
 * @access  Public
 */
router.get('/', getCategories);

module.exports = router;
