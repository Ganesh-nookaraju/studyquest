// backend/models/Score.js
const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true, // References courseKey or categoryKey (e.g. 'html')
    lowercase: true,
    trim: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard'],
    lowercase: true
  },
  score: {
    type: Number,
    required: true // Points scored (e.g. 30/50, or 4/5 correct answers translated to XP)
  },
  percentage: {
    type: Number,
    required: true // Passing percentage (e.g. 80%)
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  wrongAnswers: {
    type: Number,
    required: true
  },
  attemptDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Score', ScoreSchema);
