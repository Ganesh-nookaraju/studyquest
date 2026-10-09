// backend/utils/seedQuestions.js
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('⚠️ Unable to set custom DNS servers:', dnsErr.message);
}

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const Question = require('../models/Question');

// Load environment variables relative to current directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedQuestions = async () => {
  try {
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI === 'YOUR_MONGODB_URI') {
      throw new Error('Please configure a valid MONGODB_URI in your backend/.env file first!');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas successfully for question seeding...');

    // Resolve path to the frontend data/questions.json
    let filePath = path.join(__dirname, '../../frontend/data/questions.json');
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, '../../data/questions.json');
    }
    if (!fs.existsSync(filePath)) {
      throw new Error(`questions.json file not found at path: ${filePath}`);
    }

    const rawData = fs.readFileSync(filePath, 'utf8');
    const questionsObj = JSON.parse(rawData);

    const questionsList = [];

    // Parse the nested questions structure
    for (const [subjectKey, difficulties] of Object.entries(questionsObj)) {
      // Loop through difficulties (easy, medium, hard)
      for (const [difficultyKey, questionsArray] of Object.entries(difficulties)) {
        for (const q of questionsArray) {
          questionsList.push({
            course: subjectKey,
            difficulty: difficultyKey,
            question: q.question,
            options: q.options,
            correctAnswer: q.answer, // Map frontend 'answer' key to Mongoose 'correctAnswer' index
            marks: 10
          });
        }
      }
    }

    console.log(`Parsed ${questionsList.length} total questions from questions.json.`);

    // Clear existing questions to avoid duplicate records
    await Question.deleteMany({});
    console.log('Cleared existing questions collection.');

    // Bulk insert parsed list into MongoDB
    const createdQuestions = await Question.insertMany(questionsList);
    console.log(`✅ Successfully seeded ${createdQuestions.length} questions into MongoDB Atlas!`);

    mongoose.connection.close();
    console.log('🎉 Question seeding complete!');
  } catch (error) {
    console.error(`❌ Seeding questions failed: ${error.message}`);
    process.exit(1);
  }
};

seedQuestions();
