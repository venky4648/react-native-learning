const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  microsoftAuth,
  getUserProfile,
  microsoftLoginRedirect,
  microsoftCallback,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public Routes
router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/microsoft', microsoftAuth);
router.get('/microsoft/login', microsoftLoginRedirect);
router.get('/microsoft/callback', microsoftCallback);

// Protected Routes (JWT Bearer Token Required)
router.get('/profile', protect, getUserProfile);

module.exports = router;
