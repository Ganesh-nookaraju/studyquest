// backend/utils/seedCategories.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Category = require('../models/Category');

// Load environment variables relative to current directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const categoriesData = [
  {
    categoryKey: 'c',
    categoryName: 'C Programming',
    icon: 'fas fa-code',
    description: 'Learn pointers, memory allocation, structure overlays, and static compilers.'
  },
  {
    categoryKey: 'cpp',
    categoryName: 'C++',
    icon: 'fas fa-terminal',
    description: 'Dive into OOP, encapsulation, virtual constructors, dynamic delete, and STL templates.'
  },
  {
    categoryKey: 'java',
    categoryName: 'Java Standard Edition',
    icon: 'fab fa-java',
    description: 'Explore JVM structures, class polymorphism, checked exceptions, and threads.'
  },
  {
    categoryKey: 'sql',
    categoryName: 'SQL & Joins',
    icon: 'fas fa-database',
    description: 'Build queries, database joins, indexes, subqueries, and database commits.'
  },
  {
    categoryKey: 'dbms',
    categoryName: 'Database Systems',
    icon: 'fas fa-server',
    description: 'Analyze data integrity, 3NF normalization, transactions, ACID properties, and locks.'
  },
  {
    categoryKey: 'json',
    categoryName: 'JSON Data Format',
    icon: 'fas fa-code-branch',
    description: 'Format variables, parse text strings, structure nesting, and validate schema rules.'
  },
  {
    categoryKey: 'reactjs',
    categoryName: 'React JS Framework',
    icon: 'fab fa-react',
    description: 'Understand virtual DOM diffs, state hooks, components props, context APIs, and JSX.'
  },
  {
    categoryKey: 'nodejs',
    categoryName: 'Node JS',
    icon: 'fab fa-node-js',
    description: 'Build scalable backend applications using asynchronous, event-driven JavaScript runtimes.'
  },
  {
    categoryKey: 'expressjs',
    categoryName: 'Express JS',
    icon: 'fas fa-network-wired',
    description: 'Design RESTful API routers, middleware handlers, and request filter boundaries.'
  },
  {
    categoryKey: 'mongodb',
    categoryName: 'MongoDB Database',
    icon: 'fas fa-leaf',
    description: 'Store document models, build aggregation pipelines, and optimize index performance.'
  },
  {
    categoryKey: 'datastructures',
    categoryName: 'Data Structures',
    icon: 'fas fa-project-diagram',
    description: 'Implement stacks, LIFO queues, linked lists, binary search trees, and custom hashes.'
  },
  {
    categoryKey: 'algorithms',
    categoryName: 'Algorithms',
    icon: 'fas fa-calculator',
    description: 'Study recursion depth, sorting Big O notation, Dijkstra pathfinding, and greedy algorithms.'
  },
  {
    categoryKey: 'os',
    categoryName: 'Operating Systems',
    icon: 'fas fa-desktop',
    description: 'Master CPU scheduling, process sync, virtual memory models, and thread threads.'
  },
  {
    categoryKey: 'networks',
    categoryName: 'Computer Networks',
    icon: 'fas fa-network-wired',
    description: 'Analyze OSI 7-layer stacks, TCP/IP handshakes, routing protocols, and subnet masks.'
  },
  {
    categoryKey: 'git',
    categoryName: 'Git & GitHub',
    icon: 'fab fa-github',
    description: 'Track source code commits history, resolve merge conflicts, branch, and push repositories.'
  }
];

const seedCategories = async () => {
  try {
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI === 'YOUR_MONGODB_URI') {
      throw new Error('Please configure a valid MONGODB_URI in your backend/.env file first!');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas successfully for seeding categories...');

    for (const category of categoriesData) {
      const exists = await Category.findOne({ categoryKey: category.categoryKey });
      if (!exists) {
        await Category.create(category);
        console.log(`✅ Seeded Category: ${category.categoryName}`);
      } else {
        console.log(`ℹ️ Category already exists, skipped: ${category.categoryName}`);
      }
    }

    console.log('🎉 Category seeding sequence complete!');
    mongoose.connection.close();
  } catch (error) {
    console.error(`❌ Seeding categories failed: ${error.message}`);
    process.exit(1);
  }
};

seedCategories();
