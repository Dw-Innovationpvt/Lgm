const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const ErrorResponse = require('../utils/errorResponse');

// Helper function to get Razorpay instance
const getRazorpayInstance = () => {
  // Ensure we have the credentials
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!key_id || !key_secret) {
    console.error('Razorpay credentials missing:', {
      key_id: key_id ? 'Set' : 'Not set',
      key_secret: key_secret ? 'Set' : 'Not set'
    });
    throw new Error('Razorpay credentials not properly configured');
  }
  
  return new Razorpay({
    key_id,
    key_secret
  });
};

// Log that the controller is loaded
console.log('Payment controller loaded');

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    console.log('Creating Razorpay order with request body:', JSON.stringify(req.body));
    const { orderId } = req.body;

    if (!orderId) {
      console.error('Missing orderId in request body');
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Find order
    console.log(`Looking up order with ID: ${orderId}`);
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    // Get Razorpay instance
    const razorpay = getRazorpayInstance();
    
    // Create Razorpay order
    // Ensure amount is an integer in paise (multiply by 100 and round)
    const amountInPaise = Math.round(order.totalPrice * 100);
    console.log(`Creating Razorpay order: ${amountInPaise} paise for order ${order._id}`);
    
    // Validate amount
    if (amountInPaise <= 0) {
      console.error(`Invalid order amount: ${amountInPaise} paise`);
      return res.status(400).json({
        success: false,
        message: 'Order amount must be greater than 0'
      });
    }
    
    // Log Razorpay key being used
    console.log(`Using Razorpay key: ${process.env.RAZORPAY_KEY_ID}`);
    
    // Create order with detailed parameters
    const razorpayOrderParams = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: order._id.toString(),
      notes: {
        orderId: order._id.toString(),
        userId: req.user.id,
        customerName: order.shippingAddress?.name || 'Customer',
        customerEmail: order.shippingAddress?.email || 'Not provided'
      }
    };
    
    console.log('Razorpay order parameters:', JSON.stringify(razorpayOrderParams));
    
    const razorpayOrder = await razorpay.orders.create(razorpayOrderParams);

    // Save Razorpay order ID to our order
    order.paymentResult = {
      razorpayOrderId: razorpayOrder.id,
      status: 'created'
    };
    await order.save();

    // Log the successful order creation
    console.log('Razorpay order created successfully:', razorpayOrder.id);
    
    res.status(200).json({
      success: true,
      order: razorpayOrder,
      key_id: process.env.RAZORPAY_KEY_ID,
      // Include additional helpful information
      orderDetails: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status,
        created_at: razorpayOrder.created_at
      }
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    next(err);
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Find our order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update order status
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature,
      status: 'completed',
      update_time: new Date().toISOString()
    };

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Process payment webhook (for Razorpay)
// @route   POST /api/payments/webhook
// @access  Public
exports.processWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    
    // Verify webhook signature if webhook secret is provided
    if (process.env.RAZORPAY_WEBHOOK_SECRET && signature) {
      const isValidSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (signature !== isValidSignature) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    } else {
      console.log('Webhook signature verification skipped: No webhook secret provided or no signature in request');
    }
    
    // Get Razorpay instance (for potential API calls if needed)
    const razorpay = getRazorpayInstance();
    
    const event = req.body;
    
    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const paymentData = event.payload.payment.entity;
      
      // Find order by Razorpay order ID
      const order = await Order.findOne({
        'paymentResult.razorpayOrderId': paymentData.order_id
      });
      
      if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: paymentData.id,
          orderId: paymentData.order_id,
          status: 'completed',
          update_time: new Date().toISOString()
        };
        
        await order.save();
      }
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get payment status
// @route   GET /api/payments/:orderId/status
// @access  Private
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      isPaid: order.isPaid,
      paymentMethod: order.paymentMethod,
      paymentResult: order.paymentResult
    });
  } catch (err) {
    next(err);
  }
};
