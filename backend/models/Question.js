// backend/models/Question.js
const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  course: {
    type: String,
    required: [true, 'Please specify the subject/course key'], // references courseKey or categoryKey (e.g. 'html', 'sql')
    lowercase: true,
    trim: true
  },
  difficulty: {
    type: String,
    required: [true, 'Please specify difficulty level'],
    enum: ['easy', 'medium', 'hard'],
    lowercase: true
  },
  question: {
    type: String,
    required: [true, 'Please add a question text'],
    trim: true
  },
  options: {
    type: [String],
    required: [true, 'Please provide array of choice options'],
    validate: [arr => arr.length >= 2, 'Options array must contain at least 2 choices']
  },
  correctAnswer: {
    type: Number,
    required: [true, 'Please specify index of correct answer (0-indexed)']
  },
  marks: {
    type: Number,
    default: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound Index: Accelerates fetching matching questions by subject and level
QuestionSchema.index({ course: 1, difficulty: 1 });

module.exports = mongoose.model('Question', QuestionSchema);
