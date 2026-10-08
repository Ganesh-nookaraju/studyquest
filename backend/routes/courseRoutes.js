// backend/routes/courseRoutes.js
const express = require('express');
const router = express.Router();

// Import course controllers
const {
  getCourses,
  getCourseById
} = require('../controllers/courseController');

/**
 * @route   GET /api/courses
 * @desc    Get all active syllabus courses
 * @access  Public
 */
router.get('/', getCourses);

/**
 * @route   GET /api/courses/:id
 * @desc    Get details for a specific course (via ObjectID or courseKey)
 * @access  Public
 */
router.get('/:id', getCourseById);

module.exports = router;
