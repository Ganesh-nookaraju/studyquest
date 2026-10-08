// backend/models/Course.js
const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  courseKey: {
    type: String,
    required: true,
    unique: true, // e.g., 'html', 'css', 'javascript', 'python'
    lowercase: true,
    trim: true
  },
  courseName: {
    type: String,
    required: [true, 'Please add a course name'],
    trim: true
  },
  icon: {
    type: String,
    required: true // FontAwesome class names (e.g. 'fab fa-html5')
  },
  description: {
    type: String,
    required: [true, 'Please add a course description']
  },
  totalQuestions: {
    type: Number,
    default: 30
  },
  difficultyLevels: {
    type: [String],
    default: ['easy', 'medium', 'hard']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
});

module.exports = mongoose.model('Course', CourseSchema);
