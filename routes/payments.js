const express = require('express');
const router = express.Router();

// Middleware
const { protect } = require('../middleware/authMiddleware');

// Controllers
const {
  createRazorpayOrder,
  verifyPayment,
  processWebhook,
  getPaymentStatus
} = require('../controllers/paymentController');

/**
 * @route   POST /api/payments/create-order
 * @desc    Create a Razorpay order
 * @access  Private
 */
router.post('/create-order', protect, createRazorpayOrder);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify Razorpay payment
 * @access  Private
 */
router.post('/verify', protect, verifyPayment);

/**
 * @route   POST /api/payments/webhook
 * @desc    Process Razorpay webhook
 * @access  Public
 */
router.post('/webhook', processWebhook);

/**
 * @route   GET /api/payments/:orderId/status
 * @desc    Get payment status
 * @access  Private
 */
router.get('/:orderId/status', protect, getPaymentStatus);

module.exports = router;
