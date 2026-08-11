const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkey', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user (Sign Up)
// @route   POST /api/auth/signup
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user
    const user = await User.create({
      name: name || '',
      email: email.toLowerCase(),
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token (Log In)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Check password
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate/Register user via Microsoft Sign-In
// @route   POST /api/auth/microsoft
// @access  Public
const microsoftAuth = async (req, res) => {
  try {
    const { email, name, microsoftId } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Microsoft email is required' });
    }

    let user = await User.findOne({
      $or: [{ microsoftId }, { email: email.toLowerCase() }],
    });

    if (user) {
      // Update microsoftId if user previously registered via email
      if (!user.microsoftId && microsoftId) {
        user.microsoftId = microsoftId;
        await user.save();
      }
    } else {
      // Create new Microsoft user
      user = await User.create({
        name: name || 'Microsoft User',
        email: email.toLowerCase(),
        microsoftId: microsoftId || null,
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get authenticated user profile
// @route   GET /api/auth/profile
// @access  Private (Protected by JWT)
const getUserProfile = async (req, res) => {
  if (req.user) {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      microsoftId: req.user.microsoftId,
      createdAt: req.user.createdAt,
    });
  } else {
    res.status(404).json({ message: 'User profile not found' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  microsoftAuth,
  getUserProfile,
};
