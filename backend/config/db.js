// backend/config/db.js
const mongoose = require('mongoose');

/**
 * Establish a connection to the MongoDB Atlas cluster.
 * process.env.MONGODB_URI is loaded from the .env configuration.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Force IPv4 to bypass local DNS/IPv6 routing delays to Atlas
    });
    
    console.log(`=========================================`);
    console.log(`🟢 MongoDB Connected successfully!`);
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    console.log(`=========================================`);
  } catch (error) {
    console.error(`🔴 Error connecting to MongoDB: ${error.message}`);
    // Exit application process with failure status code (1) if connection fails
    process.exit(1);
  }
};

module.exports = connectDB;
