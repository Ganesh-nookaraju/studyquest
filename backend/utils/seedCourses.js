// backend/utils/seedCourses.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Course = require('../models/Course');

// Load environment variables relative to current directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const coursesData = [
  {
    courseKey: 'html',
    courseName: 'HTML5',
    icon: 'fab fa-html5',
    description: 'Structure web pages with elements, semantic layouts, inputs, and canvas.',
    totalQuestions: 30
  },
  {
    courseKey: 'css',
    courseName: 'CSS3 Styles',
    icon: 'fab fa-css3-alt',
    description: 'Design stunning responsive UI with Flexbox, CSS Grid, animations, and shadows.',
    totalQuestions: 30
  },
  {
    courseKey: 'javascript',
    courseName: 'JavaScript (ES6)',
    icon: 'fab fa-js',
    description: 'Bring pages to life with closures, arrays, promises, APIs, and the event loop.',
    totalQuestions: 30
  },
  {
    courseKey: 'python',
    courseName: 'Python Programming',
    icon: 'fab fa-python',
    description: 'Master lists, dictionaries, list comprehension, generators, and decorators.',
    totalQuestions: 30
  }
];

const seedCourses = async () => {
  try {
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI === 'YOUR_MONGODB_URI') {
      throw new Error('Please configure a valid MONGODB_URI in your backend/.env file first!');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas successfully for seeding...');

    for (const course of coursesData) {
      const exists = await Course.findOne({ courseKey: course.courseKey });
      if (!exists) {
        await Course.create(course);
        console.log(`✅ Seeded Course: ${course.courseName}`);
      } else {
        console.log(`ℹ️ Course already exists, skipped: ${course.courseName}`);
      }
    }

    console.log('🎉 Course seeding sequence complete!');
    mongoose.connection.close();
  } catch (error) {
    console.error(`❌ Seeding courses failed: ${error.message}`);
    process.exit(1);
  }
};

seedCourses();
