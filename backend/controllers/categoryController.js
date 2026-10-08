// backend/controllers/categoryController.js
const Category = require('../models/Category');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = async (req, res) => {
  try {
    // Retrieve all categories from database
    const categories = await Category.find({});

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error(`Fetch categories error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving categories list.'
    });
  }
};

module.exports = {
  getCategories
};
