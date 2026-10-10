// backend/test_all_exams.js
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch(e) {}
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Course = require('./models/Course');
const Category = require('./models/Category');
const Question = require('./models/Question');
const Score = require('./models/Score');

const { getQuizQuestions, submitQuiz } = require('./controllers/quizController');

const courses = ['html', 'css', 'javascript', 'python'];
const categories = [
  'c', 'cpp', 'java', 'sql', 'dbms', 'json',
  'reactjs', 'nodejs', 'expressjs', 'mongodb',
  'datastructures', 'algorithms', 'os', 'networks', 'git'
];
const difficulties = ['easy', 'medium', 'hard'];

async function runTestSuite() {
  console.log('====================================================');
  console.log('       STUDYQUEST EXAM SERVER & NETWORK TEST SUITE  ');
  console.log('====================================================');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🟢 Connected to MongoDB Atlas successfully.\n');

  // Find or create test runner user
  let testUser = await User.findOne({ email: 'examtester@studyquest.com' });
  if (!testUser) {
    testUser = await User.create({
      username: 'ExamTester',
      email: 'examtester@studyquest.com',
      password: 'password123'
    });
  }

  const token = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  console.log(`👤 Test Runner Authenticated: ${testUser.username}\n`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const failureList = [];

  // Helper to execute mock controller calls
  const executeGet = async (subject, diff, user) => {
    let statusCode = 200;
    let payload = null;
    const req = {
      params: { courseKey: subject },
      query: { difficulty: diff },
      user
    };
    const res = {
      status(code) { statusCode = code; return this; },
      json(data) { payload = data; return this; }
    };
    await getQuizQuestions(req, res);
    return { statusCode, payload };
  };

  const executeSubmit = async (subject, diff, answers, user, guestName) => {
    let statusCode = 200;
    let payload = null;
    const req = {
      body: {
        course: subject,
        difficulty: diff,
        answers,
        username: guestName
      },
      user
    };
    const res = {
      status(code) { statusCode = code; return this; },
      json(data) { payload = data; return this; }
    };
    await submitQuiz(req, res);
    return { statusCode, payload };
  };

  // 1. TEST SECTION: COURSES
  console.log('----------------------------------------------------');
  console.log(' SECTION 1: COURSES (HTML, CSS, JavaScript, Python) ');
  console.log('----------------------------------------------------');
  for (const c of courses) {
    for (const diff of difficulties) {
      totalTests++;
      const getRes = await executeGet(c, diff, testUser);
      if (getRes.statusCode !== 200 || !getRes.payload.success || !getRes.payload.questions) {
        failedTests++;
        failureList.push(`Course GET failed: ${c} [${diff}] - Status ${getRes.statusCode}`);
        console.log(`  ❌ ${c.padEnd(14)} [${diff.padEnd(6)}] GET Questions: FAILED`);
        continue;
      }

      const qList = getRes.payload.questions;
      const selected = qList.slice(0, 5);
      const answers = selected.map(q => ({
        questionId: q._id,
        selectedOption: 0
      }));

      const submitRes = await executeSubmit(c, diff, answers, testUser);
      if (submitRes.statusCode !== 201 || !submitRes.payload.success || !submitRes.payload.result) {
        failedTests++;
        failureList.push(`Course SUBMIT failed: ${c} [${diff}] - Status ${submitRes.statusCode}`);
        console.log(`  ❌ ${c.padEnd(14)} [${diff.padEnd(6)}] SUBMIT: FAILED`);
      } else {
        passedTests++;
        const r = submitRes.payload.result;
        console.log(`  ✅ ${c.padEnd(14)} [${diff.padEnd(6)}] GET: ${qList.length} Qs | SUBMIT: ${r.score}/${r.totalQuestions} graded | DB Score ID: ${r.scoreId}`);
      }
    }
  }

  // 2. TEST SECTION: CATEGORIES
  console.log('\n----------------------------------------------------');
  console.log(' SECTION 2: CATEGORIES (C, C++, Java, SQL, React, etc.)');
  console.log('----------------------------------------------------');
  for (const cat of categories) {
    for (const diff of difficulties) {
      totalTests++;
      const getRes = await executeGet(cat, diff, testUser);
      if (getRes.statusCode !== 200 || !getRes.payload.success || !getRes.payload.questions) {
        failedTests++;
        failureList.push(`Category GET failed: ${cat} [${diff}] - Status ${getRes.statusCode}`);
        console.log(`  ❌ ${cat.padEnd(14)} [${diff.padEnd(6)}] GET Questions: FAILED`);
        continue;
      }

      const qList = getRes.payload.questions;
      const selected = qList.slice(0, 5);
      const answers = selected.map(q => ({
        questionId: q._id,
        selectedOption: 0
      }));

      const submitRes = await executeSubmit(cat, diff, answers, testUser);
      if (submitRes.statusCode !== 201 || !submitRes.payload.success || !submitRes.payload.result) {
        failedTests++;
        failureList.push(`Category SUBMIT failed: ${cat} [${diff}] - Status ${submitRes.statusCode}`);
        console.log(`  ❌ ${cat.padEnd(14)} [${diff.padEnd(6)}] SUBMIT: FAILED`);
      } else {
        passedTests++;
        const r = submitRes.payload.result;
        console.log(`  ✅ ${cat.padEnd(14)} [${diff.padEnd(6)}] GET: ${qList.length} Qs | SUBMIT: ${r.score}/${r.totalQuestions} graded | DB Score ID: ${r.scoreId}`);
      }
    }
  }

  // 3. TEST SECTION: GUEST / UNREGISTERED SESSION TESTING (Network / Live Server medium)
  console.log('\n----------------------------------------------------');
  console.log(' SECTION 3: GUEST / UNREGISTERED NETWORK EXAMS      ');
  console.log('----------------------------------------------------');
  const guestSubjects = ['javascript', 'sql', 'reactjs', 'nodejs', 'git'];
  for (const s of guestSubjects) {
    totalTests++;
    // No user attached (guest session)
    const getRes = await executeGet(s, 'easy', null);
    if (getRes.statusCode === 200 && getRes.payload.success) {
      const qList = getRes.payload.questions;
      const selected = qList.slice(0, 5);
      const answers = selected.map(q => ({
        questionId: q._id,
        selectedOption: 0
      }));

      const submitRes = await executeSubmit(s, 'easy', answers, null, 'GuestStudent');
      if (submitRes.statusCode === 201 && submitRes.payload.success) {
        passedTests++;
        const r = submitRes.payload.result;
        console.log(`  ✅ Guest Exam [${s.padEnd(12)}] Successfully recorded to MongoDB (ID: ${r.scoreId})`);
      } else {
        failedTests++;
        failureList.push(`Guest SUBMIT failed for ${s}`);
        console.log(`  ❌ Guest Exam [${s}] SUBMIT: FAILED`);
      }
    } else {
      failedTests++;
      failureList.push(`Guest GET failed for ${s}`);
      console.log(`  ❌ Guest Exam [${s}] GET: FAILED`);
    }
  }

  // 4. TEST SECTION: ALIAS ROUTE RESILIENCE
  console.log('\n----------------------------------------------------');
  console.log(' SECTION 4: ALIAS ROUTE RESILIENCE (c++, dsa, react) ');
  console.log('----------------------------------------------------');
  const aliasTests = [
    { alias: 'c++', expectedCourse: 'cpp' },
    { alias: 'dsa', expectedCourse: 'datastructures' },
    { alias: 'react', expectedCourse: 'reactjs' },
    { alias: 'js', expectedCourse: 'javascript' },
    { alias: 'py', expectedCourse: 'python' }
  ];

  for (const item of aliasTests) {
    totalTests++;
    const getRes = await executeGet(item.alias, 'easy', testUser);
    if (getRes.statusCode === 200 && getRes.payload.success) {
      const submitRes = await executeSubmit(item.alias, 'easy', getRes.payload.questions.slice(0, 5).map(q => ({ questionId: q._id, selectedOption: 0 })), testUser);
      if (submitRes.statusCode === 201 && submitRes.payload.result.course === item.expectedCourse) {
        passedTests++;
        console.log(`  ✅ Alias '${item.alias}' correctly normalized to '${item.expectedCourse}' and recorded.`);
      } else {
        failedTests++;
        failureList.push(`Alias submit failed for '${item.alias}'`);
        console.log(`  ❌ Alias submit failed for '${item.alias}'`);
      }
    } else {
      failedTests++;
      failureList.push(`Alias get failed for '${item.alias}'`);
      console.log(`  ❌ Alias get failed for '${item.alias}'`);
    }
  }

  // Clean up test scores
  await Score.deleteMany({ username: { $in: ['ExamTester', 'GuestStudent'] } });
  console.log('\n🧹 Cleaned up temporary test scores from database.');

  console.log('\n====================================================');
  console.log(` TEST SUMMARY: ${passedTests}/${totalTests} PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
  if (failedTests > 0) {
    console.log(` FAILURES (${failedTests}):`);
    failureList.forEach(f => console.log('  - ' + f));
  } else {
    console.log(' 🎉 ALL EXAM TESTS IN ALL SECTIONS PASSED WITH 100% SUCCESS!');
  }
  console.log('====================================================');

  await mongoose.disconnect();
  process.exit(failedTests > 0 ? 1 : 0);
}

runTestSuite().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
