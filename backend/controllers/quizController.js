// backend/controllers/quizController.js
const Question = require('../models/Question');
const Score = require('../models/Score');
const Course = require('../models/Course');
const Category = require('../models/Category');

// Course and Category key alias mapping to ensure network/client requests never fail on variations
const subjectAliasMap = {
  js: 'javascript',
  'javascript': 'javascript',
  py: 'python',
  python: 'python',
  css: 'css',
  html: 'html',
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
  java: 'java',
  sql: 'sql',
  dbms: 'dbms',
  json: 'json',
  react: 'reactjs',
  reactjs: 'reactjs',
  'react.js': 'reactjs',
  node: 'nodejs',
  nodejs: 'nodejs',
  'node.js': 'nodejs',
  express: 'expressjs',
  expressjs: 'expressjs',
  'express.js': 'expressjs',
  mongo: 'mongodb',
  mongodb: 'mongodb',
  ds: 'datastructures',
  dsa: 'datastructures',
  datastructures: 'datastructures',
  algo: 'algorithms',
  algorithms: 'algorithms',
  os: 'os',
  network: 'networks',
  networks: 'networks',
  git: 'git'
};

const normalizeCourseKey = (key) => {
  if (!key) return '';
  const clean = key.toLowerCase().trim();
  return subjectAliasMap[clean] || clean;
};

/**
 * @desc    Get randomized quiz questions for a specific course or category
 * @route   GET /api/quiz/:courseKey
 * @access  Public / Optional Auth
 */
const getQuizQuestions = async (req, res) => {
  try {
    const rawKey = req.params.courseKey;
    const courseKey = normalizeCourseKey(rawKey);

    // 1. Verify if the course or category exists or has questions
    let subjectExists = await Course.findOne({ courseKey, status: 'active' });
    if (!subjectExists) {
      subjectExists = await Category.findOne({ categoryKey: courseKey });
    }

    // 2. Fetch up to 10 randomized questions using MongoDB aggregation
    const matchStage = { course: courseKey };
    if (req.query.difficulty) {
      matchStage.difficulty = req.query.difficulty.toLowerCase().trim();
    }

    let questions = await Question.aggregate([
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

    // If requested difficulty yielded 0, attempt fallback across any difficulty for the subject
    if (questions.length === 0) {
      questions = await Question.aggregate([
        { $match: { course: courseKey } },
        { $sample: { size: 10 } },
        {
          $project: {
            correctAnswer: 0,
            createdAt: 0,
            __v: 0
          }
        }
      ]);
    }

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No questions found for the course or category: ${courseKey}`
      });
    }

    return res.status(200).json({
      success: true,
      course: courseKey,
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
 * @desc    Submit answers, grade quiz, and save results in MongoDB
 * @route   POST /api/quiz/submit
 * @access  Public / Optional Auth (records for authenticated user or guest)
 */
const submitQuiz = async (req, res) => {
  try {
    const { course, difficulty, answers, username } = req.body;

    // 1. Input Presence Validation
    if (!course || !difficulty || !answers) {
      return res.status(400).json({
        success: false,
        message: 'Please provide course, difficulty, and answers'
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers must be submitted as an array'
      });
    }

    const trimmedCourse = normalizeCourseKey(course);
    const trimmedDifficulty = difficulty.toLowerCase().trim();

    if (!['easy', 'medium', 'hard'].includes(trimmedDifficulty)) {
      return res.status(400).json({
        success: false,
        message: "Difficulty must be one of: 'easy', 'medium', or 'hard'"
      });
    }

    if (answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Submission must contain answers.'
      });
    }

    // Deduplicate answers by question identifier
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

    const questionIds = uniqueAnswers.map(a => a.questionId.toString());
    const validMongoIds = questionIds.filter(id => id.match(/^[0-9a-fA-F]{24}$/));

    let dbQuestions = [];
    if (validMongoIds.length > 0) {
      dbQuestions = await Question.find({ _id: { $in: validMongoIds } });
    }

    // If some or all question IDs were non-ObjectId (e.g. from local dataset fallback like "html_e1"),
    // fetch questions by course to grade by index or matching question content
    if (dbQuestions.length === 0) {
      dbQuestions = await Question.find({ course: trimmedCourse, difficulty: trimmedDifficulty });
      if (dbQuestions.length === 0) {
        dbQuestions = await Question.find({ course: trimmedCourse });
      }
    }

    const dbQuestionsMap = new Map();
    dbQuestions.forEach(q => {
      dbQuestionsMap.set(q._id.toString(), q);
    });

    let correctAnswers = 0;
    let wrongAnswers = 0;
    let totalScore = 0;
    let maxPossibleScore = 0;
    const gradedDetails = [];

    // Grade each submitted answer
    uniqueAnswers.forEach((ans, idx) => {
      let q = dbQuestionsMap.get(ans.questionId.toString());
      // Fallback matching by positional order if question was from local ID set
      if (!q && dbQuestions[idx]) {
        q = dbQuestions[idx];
      }

      if (q) {
        const isCorrect = (ans.selectedOption !== null && ans.selectedOption !== undefined) && (ans.selectedOption === q.correctAnswer);
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
      } else {
        // Unknown question fallback
        wrongAnswers++;
        maxPossibleScore += 10;
      }
    });

    // Ensure maxPossibleScore is at least 10 to avoid division by zero
    if (maxPossibleScore === 0) maxPossibleScore = uniqueAnswers.length * 10;

    const percentage = Math.round((correctAnswers / uniqueAnswers.length) * 100);
    const passed = percentage >= 60;

    // Determine user details (authenticated user or guest)
    const effectiveUserId = req.user ? req.user._id : null;
    const effectiveUsername = req.user ? req.user.username : (username ? String(username).trim() : 'Guest Student');

    // 5. Store score details in database
    const quizScore = await Score.create({
      userId: effectiveUserId,
      username: effectiveUsername,
      course: trimmedCourse,
      difficulty: trimmedDifficulty,
      score: totalScore,
      percentage,
      correctAnswers,
      wrongAnswers
    });

    return res.status(201).json({
      success: true,
      message: 'Quiz submitted and graded successfully',
      result: {
        scoreId: quizScore._id,
        course: trimmedCourse,
        difficulty: trimmedDifficulty,
        score: correctAnswers, // score count out of total questions
        pointsEarned: totalScore,
        totalQuestions: uniqueAnswers.length,
        maxPossibleScore,
        percentage,
        correctAnswers,
        wrongAnswers,
        passed,
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
  submitQuiz,
  subjectAliasMap
};
