const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getUserCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });

    // If no cart exists, create an empty one
    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [],
        totalPrice: 0
      });
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, type } = req.body;

    // Validate request
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a product ID'
      });
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is in stock
    if (product.countInStock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock'
      });
    }

    // Find user cart
    let cart = await Cart.findOne({ user: req.user.id });

    // If no cart exists, create one
    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [],
        totalPrice: 0
      });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.type === type
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        product: productId,
        name: product.name,
        image: product.images[0],
        price: product.price,
        quantity,
        type: type || product.type
      });
    }

    // Calculate total price
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Save cart
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    // Validate request
    if (!quantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a quantity'
      });
    }

    // Find user cart
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // If quantity is 0 or less, remove item
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    // Calculate total price
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Save cart
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
exports.removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    // Find user cart
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Remove item
    cart.items.splice(itemIndex, 1);

    // Calculate total price
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Save cart
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res, next) => {
  try {
    // Find user cart
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Clear items
    cart.items = [];
    cart.totalPrice = 0;

    // Save cart
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (err) {
    next(err);
  }
};
