const sgMail = require('@sendgrid/mail');

/**
 * Initialize SendGrid with API key
 * This should be called when the server starts
 */
const initializeSendGrid = () => {
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('SendGrid initialized successfully');
    return true;
  } else {
    console.error('SendGrid API key not found in environment variables');
    return false;
  }
};

/**
 * Send OTP email using SendGrid
 * @param {string} email - Recipient email address
 * @param {string} otp - One-time password
 * @returns {Promise<boolean>} - Success status
 */
const sendOTPEmail = async (email, otp) => {
  try {
    // Make sure SendGrid is initialized
    if (!process.env.SENDGRID_API_KEY) {
      initializeSendGrid();
    }

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@lgmsports.com', // Use verified sender
      subject: 'Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #333; text-align: center;">Password Reset Request</h1>
          <p style="font-size: 16px; line-height: 1.5;">You requested to reset your password for your LGM Sports account.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <p style="font-size: 14px; margin: 0;">Your OTP for password reset is:</p>
            <h2 style="margin: 10px 0; color: #4a90e2;">${otp}</h2>
          </div>
          <p style="font-size: 16px; line-height: 1.5;">This OTP will expire in 10 minutes.</p>
          <p style="font-size: 14px; color: #777; margin-top: 30px;">If you did not request this password reset, please ignore this email.</p>
          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #999;">
            <p>© ${new Date().getFullYear()} LGM Sports. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);
    console.log('Password reset email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    return false;
  }
};

module.exports = {
  initializeSendGrid,
  sendOTPEmail
};
