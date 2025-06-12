const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  logout 
} = require('../controllers/authController');
const {
  forgotPassword,
  verifyOTP,
  resetPassword
} = require('../controllers/forgotPasswordController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
