// backend/controllers/quizController.js
const Question = require('../models/Question');
const Score = require('../models/Score');
const Course = require('../models/Course');
const Category = require('../models/Category');

/**
 * @desc    Get 10 randomized questions for a specific course
 * @route   GET /api/quiz/:courseKey
 * @access  Private
 */
const getQuizQuestions = async (req, res) => {
  try {
    const courseKey = req.params.courseKey.toLowerCase().trim();

    // 1. Verify if the course or category exists and is active
    let subjectExists = await Course.findOne({ courseKey, status: 'active' });
    if (!subjectExists) {
      subjectExists = await Category.findOne({ categoryKey: courseKey });
    }

    if (!subjectExists) {
      return res.status(404).json({
        success: false,
        message: `Subject '${courseKey}' not found or is inactive.`
      });
    }

    // 2. Fetch up to 10 randomized questions using MongoDB aggregation
    // Allow optional filtering by difficulty query parameter
    const matchStage = { course: courseKey };
    if (req.query.difficulty) {
      matchStage.difficulty = req.query.difficulty.toLowerCase().trim();
    }

    const questions = await Question.aggregate([
      { $match: matchStage },
      { $sample: { size: 10 } },
      {
        $project: {
          correctAnswer: 0, // CRITICAL: Do not expose correct answers to client
          createdAt: 0,
          __v: 0
        }
      }
    ]);

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No questions found for the course: ${courseKey}`
      });
    }

    return res.status(200).json({
      success: true,
      count: questions.length,
      questions
    });
  } catch (error) {
    console.error(`Get quiz questions error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving quiz questions.'
    });
  }
};

/**
 * @desc    Submit answers, grade quiz, save results
 * @route   POST /api/quiz/submit
 * @access  Private
 */
const submitQuiz = async (req, res) => {
  try {
    const { course, difficulty, answers } = req.body;

    // 1. Input Presence Validation
    if (!course || !difficulty || !answers) {
      return res.status(400).json({
        success: false,
        message: 'Please provide course, difficulty, and answers'
      });
    }

    // 2. Validate format of answers
    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers must be submitted as an array'
      });
    }

    const trimmedCourse = course.toLowerCase().trim();
    const trimmedDifficulty = difficulty.toLowerCase().trim();

    // Validate difficulty input
    if (!['easy', 'medium', 'hard'].includes(trimmedDifficulty)) {
      return res.status(400).json({
        success: false,
        message: "Difficulty must be one of: 'easy', 'medium', or 'hard'"
      });
    }

    // 3. Validate quiz size
    if (answers.length !== 5) {
      return res.status(400).json({
        success: false,
        message: 'A quiz submission must contain exactly 5 answers.'
      });
    }

    // Deduplicate answers by questionId
    const uniqueAnswers = [];
    const seenIds = new Set();
    for (const ans of answers) {
      if (!ans || !ans.questionId) continue;
      const idStr = ans.questionId.toString();
      if (!seenIds.has(idStr)) {
        seenIds.add(idStr);
        uniqueAnswers.push(ans);
      }
    }

    if (uniqueAnswers.length !== 5) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate or invalid question submissions are not allowed.'
      });
    }

    const questionIds = uniqueAnswers.map(a => a.questionId);
    
    // Ensure all questionIds are valid MongoDB ObjectIds before query
    const validIds = questionIds.filter(id => id && id.toString().match(/^[0-9a-fA-F]{24}$/));
    if (validIds.length !== questionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid questionId format in submission'
      });
    }

    const dbQuestions = await Question.find({ _id: { $in: validIds }, course: trimmedCourse });

    // Validate that all submitted question IDs exist and belong to the correct course
    if (dbQuestions.length !== uniqueAnswers.length) {
      return res.status(400).json({
        success: false,
        message: 'Some submitted questions are invalid or do not belong to the selected course.'
      });
    }

    // Map database questions by string ID for quick lookup
    const dbQuestionsMap = new Map();
    dbQuestions.forEach(q => {
      dbQuestionsMap.set(q._id.toString(), q);
    });

    let correctAnswers = 0;
    let wrongAnswers = 0;
    let totalScore = 0;
    let maxPossibleScore = 0;
    const gradedDetails = [];

    // 4. Grade each answer
    uniqueAnswers.forEach(ans => {
      const q = dbQuestionsMap.get(ans.questionId.toString());
      if (q) {
        const isCorrect = ans.selectedOption === q.correctAnswer;
        const marks = q.marks || 10;
        maxPossibleScore += marks;

        if (isCorrect) {
          correctAnswers++;
          totalScore += marks;
        } else {
          wrongAnswers++;
        }

        gradedDetails.push({
          questionId: q._id,
          question: q.question,
          selectedOption: ans.selectedOption,
          correctAnswer: q.correctAnswer,
          isCorrect
        });
      }
    });

    // If no submitted questions match existing ones in the DB
    if (dbQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid questions found for submission'
      });
    }

    // Compute percentage (rounded to nearest integer)
    const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

    // 5. Store score details in database
    const quizScore = await Score.create({
      userId: req.user._id,
      username: req.user.username,
      course: trimmedCourse,
      difficulty: trimmedDifficulty,
      score: totalScore,
      percentage,
      correctAnswers,
      wrongAnswers
    });

    // 6. Return response to user
    return res.status(201).json({
      success: true,
      message: 'Quiz submitted and graded successfully',
      result: {
        scoreId: quizScore._id,
        course: trimmedCourse,
        difficulty: trimmedDifficulty,
        score: totalScore,
        maxPossibleScore,
        percentage,
        correctAnswers,
        wrongAnswers,
        passed: percentage >= 60,
        gradedDetails
      }
    });

  } catch (error) {
    console.error(`Submit quiz error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error grading and saving quiz results.'
    });
  }
};

module.exports = {
  getQuizQuestions,
  submitQuiz
};
