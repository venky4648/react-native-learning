const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  microsoftAuth,
  getUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public Routes
router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/microsoft', microsoftAuth);

// Protected Routes (JWT Bearer Token Required)
router.get('/profile', protect, getUserProfile);

module.exports = router;
