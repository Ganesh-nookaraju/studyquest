// backend/models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  categoryKey: {
    type: String,
    required: true,
    unique: true, // e.g. 'c', 'cpp', 'java', 'sql', 'reactjs'
    lowercase: true,
    trim: true
  },
  categoryName: {
    type: String,
    required: [true, 'Please add a category name'],
    trim: true
  },
  icon: {
    type: String,
    required: true // FontAwesome class names (e.g. 'fas fa-database')
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  }
});

module.exports = mongoose.model('Category', CategorySchema);
