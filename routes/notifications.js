const express = require('express');
const {
  createNotification,
  getUserNotifications,
  markAsRead,
  deleteNotification,
  createOrderStatusNotification,
  getUnreadCount,
  markAllAsRead
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected routes
router.use(protect);

// User routes
router.get('/', getUserNotifications);
router.get('/unread/count', getUnreadCount);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

// Admin routes
router.post('/', authorize('admin'), createNotification);
router.post('/order-status', authorize('admin'), createOrderStatusNotification);

module.exports = router;
