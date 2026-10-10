// backend/routes/quizRoutes.js
console.log("quizRoutes loaded");
const express = require('express');
const router = express.Router();

// Import authentication middleware (optionalProtect attaches user if logged in, but doesn't block guest students)
const { protect, optionalProtect } = require('../middleware/authMiddleware');

// Import quiz controller handlers
const {
  getQuizQuestions,
  submitQuiz
} = require('../controllers/quizController');

/**
 * @route   GET /api/quiz/:courseKey
 * @desc    Retrieve 10 randomized quiz questions (excluding answers)
 * @access  Public / Optional Auth
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: "Quiz Route Working"
  });
});
router.get('/:courseKey', optionalProtect, getQuizQuestions);

/**
 * @route   POST /api/quiz/submit
 * @desc    Submit, grade, and record quiz results in MongoDB
 * @access  Public / Optional Auth
 */
router.post('/submit', optionalProtect, submitQuiz);

module.exports = router;
