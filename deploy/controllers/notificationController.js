const Notification = require('../models/Notification');
const User = require('../models/User');
const Order = require('../models/Order');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create a new notification
// @route   POST /api/notifications
// @access  Private/Admin
exports.createNotification = async (req, res, next) => {
  try {
    const { userId, title, message, type, orderId } = req.body;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If order ID is provided, validate order exists
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
    }

    // Create notification
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      orderId
    });

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    let notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Make sure notification belongs to user
    if (notification.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this notification'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Make sure notification belongs to user
    if (notification.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }

    await notification.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create order status change notification
// @route   POST /api/notifications/order-status
// @access  Private/Admin
exports.createOrderStatusNotification = async (req, res, next) => {
  try {
    const { orderId, status } = req.body;

    // Validate order exists
    const order = await Order.findById(orderId).populate('user', 'id name');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Create appropriate message based on status
    let title, message;
    
    switch(status) {
      case 'processing':
        title = 'Order Processing';
        message = `Your order #${orderId.substring(0, 8)} is now being processed.`;
        break;
      case 'shipped':
        title = 'Order Shipped';
        message = `Your order #${orderId.substring(0, 8)} has been shipped.`;
        break;
      case 'delivered':
        title = 'Order Delivered';
        message = `Your order #${orderId.substring(0, 8)} has been delivered.`;
        break;
      case 'cancelled':
        title = 'Order Cancelled';
        message = `Your order #${orderId.substring(0, 8)} has been cancelled.`;
        break;
      default:
        title = 'Order Update';
        message = `Your order #${orderId.substring(0, 8)} status has been updated to ${status}.`;
    }

    // Create notification
    const notification = await Notification.create({
      user: order.user._id,
      title,
      message,
      type: 'order',
      orderId
    });

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all unread notifications count
// @route   GET /api/notifications/unread/count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ 
      user: req.user.id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      count
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    next(err);
  }
};
