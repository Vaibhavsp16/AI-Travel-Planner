const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Body parser
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`🔍 [${req.method}] ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Start Server & Connect Database
async function startServer() {
  // Try connecting to MongoDB. If it fails or is unconfigured, it defaults to jsonDb fallback.
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Express server running on port ${PORT}`);
  });
}

startServer();
