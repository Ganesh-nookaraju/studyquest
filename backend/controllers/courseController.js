// backend/controllers/courseController.js
const Course = require('../models/Course');

/**
 * @desc    Get all active courses
 * @route   GET /api/courses
 * @access  Public
 */
const getCourses = async (req, res) => {
  try {
    // Find all courses with active status
    const courses = await Course.find({ status: 'active' });

    return res.status(200).json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    console.error(`Fetch courses error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving courses list.'
    });
  }
};

/**
 * @desc    Get a single course details by Object ID or courseKey
 * @route   GET /api/courses/:id
 * @access  Public
 */
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    let course;

    // Check if the query parameter is a valid MongoDB ObjectId format
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findById(id);
    } else {
      // Fallback: Query by alphanumeric courseKey (e.g. 'html')
      course = await Course.findOne({ courseKey: id.toLowerCase() });
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    return res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    console.error(`Fetch course details error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving course details.'
    });
  }
};

module.exports = {
  getCourses,
  getCourseById
};
