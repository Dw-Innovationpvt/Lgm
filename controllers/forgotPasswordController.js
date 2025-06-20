const User = require('../models/User');
const { sendEmail } = require('../utils/brevoSimple');

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address. Please check the email or register a new account.'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // For development, log the OTP
    console.log('Generated OTP for development:', otp);
    
    // Save OTP to user document
    user.resetPasswordOTP = otp;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send OTP via email
    console.log('Attempting to send OTP email to:', email);
    const emailSent = await sendEmail(email, otp);
    
    if (!emailSent) {
      console.error('Failed to send email OTP to:', email);
      // Still return success but with a warning
      return res.status(200).json({
        success: true,
        message: 'OTP generated but email delivery may have failed',
        emailStatus: 'failed',
        otp: otp, // This would be removed in production
        note: 'Email delivery failed, but you can use the OTP shown here for testing'
      });
    }
    
    // For development, return OTP in response
    console.log('Email sent successfully, returning OTP in response');
    res.status(200).json({
      success: true,
      message: 'OTP generated and sent successfully',
      emailStatus: 'sent',
      otp: otp, // This would be removed in production
      note: 'Check your email for the OTP'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (err) {
    next(err);
  }
};
