// backend/models/Progress.js
const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: String,
    required: true, // References courseKey or categoryKey
    lowercase: true,
    trim: true
  },
  easyCompleted: {
    type: Boolean,
    default: false
  },
  mediumCompleted: {
    type: Boolean,
    default: false
  },
  hardCompleted: {
    type: Boolean,
    default: false
  },
  highestScore: {
    type: Number,
    default: 0
  },
  totalAttempts: {
    type: Number,
    default: 0
  },
  lastPlayed: {
    type: Date,
    default: Date.now
  }
});

// Compound Unique Index: Prevents duplicate progress records for a user on the same course
ProgressSchema.index({ userId: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Progress', ProgressSchema);
