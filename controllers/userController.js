const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    // Find user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.password) user.password = req.body.password;

    // Save user
    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(req.user.id).select('-password');

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add user address
// @route   POST /api/users/address
// @access  Private
exports.addAddress = async (req, res, next) => {
  try {
    const { street, city, state, postalCode, country, isDefault } = req.body;

    // Find user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create new address
    const newAddress = {
      street,
      city,
      state,
      postalCode,
      country,
      isDefault: isDefault || false
    };

    // If new address is default, set all other addresses to non-default
    if (newAddress.isDefault) {
      user.addresses.forEach(address => {
        address.isDefault = false;
      });
    }

    // Add address to user
    user.addresses.push(newAddress);

    // Save user
    await user.save();

    res.status(200).json({
      success: true,
      data: user.addresses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user address
// @route   PUT /api/users/address/:addressId
// @access  Private
exports.updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const { street, city, state, postalCode, country, isDefault } = req.body;

    // Find user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find address
    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Update address fields
    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (postalCode) address.postalCode = postalCode;
    if (country) address.country = country;
    
    // Handle default address
    if (isDefault !== undefined) {
      // If setting to default, update all other addresses
      if (isDefault) {
        user.addresses.forEach(addr => {
          addr.isDefault = addr._id.toString() === addressId;
        });
      } else {
        address.isDefault = false;
      }
    }

    // Save user
    await user.save();

    res.status(200).json({
      success: true,
      data: user.addresses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user address
// @route   DELETE /api/users/address/:addressId
// @access  Private
exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find address index
    const addressIndex = user.addresses.findIndex(
      address => address._id.toString() === req.params.addressId
    );

    // Check if address exists
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Remove address
    user.addresses.splice(addressIndex, 1);

    await user.save();

    res.status(200).json({
      success: true,
      data: user.addresses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    
    // Validate role
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid role (user or admin)'
      });
    }
    
    // Find user by ID
    const user = await User.findById(req.params.id);
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update role
    user.role = role;
    await user.save();
    
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};
