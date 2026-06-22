const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isMongooseEnabled } = require('../config/db');
const jsonDb = require('../utils/jsonDb');

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_fallback_key_12345';

// Helper to generate token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Register User
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    let existingUser;
    const lowerEmail = email.toLowerCase().trim();

    if (isMongooseEnabled()) {
      existingUser = await User.findOne({ email: lowerEmail });
    } else {
      existingUser = jsonDb.findOne('users', { email: lowerEmail });
    }

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let newUser;
    let userId;

    if (isMongooseEnabled()) {
      const user = new User({
        name,
        email: lowerEmail,
        password: passwordHash
      });
      newUser = await user.save();
      userId = newUser._id;
    } else {
      newUser = jsonDb.create('users', {
        name,
        email: lowerEmail,
        password: passwordHash
      });
      userId = newUser._id;
    }

    const token = generateToken(userId);
    res.status(201).json({
      token,
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login User
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    let user;
    const lowerEmail = email.toLowerCase().trim();

    if (isMongooseEnabled()) {
      user = await User.findOne({ email: lowerEmail });
    } else {
      user = jsonDb.findOne('users', { email: lowerEmail });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Verify Token and Get User Details
exports.verify = async (req, res) => {
  try {
    let user;
    if (isMongooseEnabled()) {
      user = await User.findById(req.user.id).select('-password');
    } else {
      user = jsonDb.findById('users', req.user.id);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id || user.id,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(500).json({ message: 'Server error verifying token' });
  }
};
