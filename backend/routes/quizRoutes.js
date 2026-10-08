// backend/routes/quizRoutes.js
console.log("quizRoutes loaded");
const express = require('express');
const router = express.Router();

// Import authentication middleware to protect quiz endpoints
const { protect } = require('../middleware/authMiddleware');

// Import quiz controller handlers
const {
  getQuizQuestions,
  submitQuiz
} = require('../controllers/quizController');

/**
 * @route   GET /api/quiz/:courseKey
 * @desc    Retrieve 10 randomized quiz questions (excluding answers)
 * @access  Private (Requires authenticated session)
 */

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: "Quiz Route Working"
  });
});
router.get('/:courseKey', protect, getQuizQuestions);

/**
 * @route   POST /api/quiz/submit
 * @desc    Submit, grade, and record quiz results
 * @access  Private (Requires authenticated session)
 */
router.post('/submit', protect, submitQuiz);

module.exports = router;
