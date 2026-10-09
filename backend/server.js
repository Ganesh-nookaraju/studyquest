const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('⚠️ Unable to set custom DNS servers:', dnsErr.message);
}

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const quizRoutes = require('./routes/quizRoutes');

// Create Express app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Request timing logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/quiz', quizRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'StudyQuest Backend Running'
  });
});

// Start server after connecting to MongoDB
const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  await connectDB();
  
  server = app.listen(PORT, () => {
    console.log("================================");
    console.log("SERVER STARTED");
    console.log("PORT:", PORT);
    console.log("================================");
  });

  server.on("error", (err) => {
    console.error("SERVER ERROR:", err);
  });
};

startServer();

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
  process.exit(1);
});

process.on("exit", (code) => {
  console.log("Node exited with code:", code);
});