// backend/config/db.js
const mongoose = require('mongoose');
const dns = require('dns');

/**
 * Configure fallback DNS resolvers (Google DNS & Cloudflare DNS)
 * Fixes 'querySrv EBADRESP' errors caused by local ISP DNS blocking SRV lookups on Windows.
 */
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('⚠️ Unable to set custom DNS servers:', dnsErr.message);
}

// Register Mongoose connection status event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection lost. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('🟢 MongoDB connection restored successfully!');
});

mongoose.connection.on('error', (err) => {
  console.error(`🔴 MongoDB connection error: ${err.message}`);
});

/**
 * Establish connection to the MongoDB Atlas cluster with auto-retry logic.
 * @param {number} retries - Number of connection attempts before failing.
 */
const connectDB = async (retries = 5) => {
  while (retries > 0) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000
      });

      console.log(`=========================================`);
      console.log(`🟢 MongoDB Connected successfully!`);
      console.log(`Host: ${conn.connection.host}`);
      console.log(`Database Name: ${conn.connection.name}`);
      console.log(`=========================================`);
      return conn;
    } catch (error) {
      retries--;
      console.error(`🔴 MongoDB Connection Error: ${error.message}`);
      if (retries === 0) {
        console.error('❌ Failed to connect to MongoDB after multiple attempts.');
        process.exit(1);
      }
      console.log(`🔄 Retrying MongoDB connection... (${retries} attempts remaining)`);
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
};

module.exports = connectDB;

