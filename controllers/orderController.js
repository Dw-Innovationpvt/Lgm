const Order = require('../models/Order');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { 
      orderItems, 
      shippingAddress, 
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    } = req.body;

    // Validate order items
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items'
      });
    }

    // Create order
    const order = await Order.create({
      user: req.user.id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    });

    // Skip product stock updates for now since we're using string IDs
    // In a production environment, you would implement a proper product lookup
    console.log('Order created successfully:', order._id);

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'id name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    // Check if order exists
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Make sure user is order owner or admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
exports.updateOrderToPaid = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    // Check if order exists
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address
    };

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
exports.updateOrderToDelivered = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    // Check if order exists
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.status = 'Delivered';

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    // Check if order exists
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const previousStatus = order.status;
    const newStatus = req.body.status;

    // Update order status
    order.status = newStatus;

    // If status is delivered, update isDelivered
    if (newStatus === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    // Create notification for the user about status change
    if (previousStatus !== newStatus) {
      try {
        // Create appropriate message based on status
        let title, message;
        
        // Convert status to lowercase for consistent switch case handling
        const statusLower = newStatus.toLowerCase();
        
        switch(statusLower) {
          case 'processing':
            title = 'Order Processing';
            message = `Your order #${order._id.toString().substring(0, 8)} is now being processed.`;
            break;
          case 'shipped':
            title = 'Order Shipped';
            message = `Your order #${order._id.toString().substring(0, 8)} has been shipped.`;
            break;
          case 'delivered':
            title = 'Order Delivered';
            message = `Your order #${order._id.toString().substring(0, 8)} has been delivered.`;
            break;
          case 'cancelled':
            title = 'Order Cancelled';
            message = `Your order #${order._id.toString().substring(0, 8)} has been cancelled.`;
            break;
          default:
            title = 'Order Update';
            message = `Your order #${order._id.toString().substring(0, 8)} status has been updated to ${newStatus}.`;
        }

        // Check if we have a valid user ID
        const userId = order.user && (typeof order.user === 'object' ? order.user._id : order.user);
        
        if (!userId) {
          console.error('Cannot create notification: No valid user ID found for order', order._id);
          return;
        }

        // Create notification
        const Notification = require('../models/Notification');
        await Notification.create({
          user: userId,
          title,
          message,
          type: 'order',
          orderId: order._id
        });

        console.log(`Notification created for user ${userId} about order ${order._id} status change to ${newStatus}`);
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the order update if notification creation fails
      }
    }

    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (err) {
    next(err);
  }
};
