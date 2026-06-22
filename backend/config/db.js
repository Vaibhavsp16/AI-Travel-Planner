const mongoose = require('mongoose');
const jsonDb = require('../utils/jsonDb');

let useMongoose = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('⚠️ MONGODB_URI environment variable is not defined.');
    console.log('📂 Running in Offline Fallback Mode: Storing data in local JSON files under backend/.data/');
    useMongoose = false;
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // fail fast if server is offline
    });
    console.log('✅ MongoDB connected successfully.');
    useMongoose = true;
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('📂 Falling back to local JSON database storage under backend/.data/');
    useMongoose = false;
    return false;
  }
}

function isMongooseEnabled() {
  return useMongoose;
}

module.exports = {
  connectDB,
  isMongooseEnabled
};
