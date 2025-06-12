const nodemailer = require('nodemailer');

// Create test account for development
const createTestAccount = async () => {
  const testAccount = await nodemailer.createTestAccount();
  console.log('Test Account:', testAccount);
  return testAccount;
};

// Create transporter based on environment
const createTransporter = async () => {
  // Always use Ethereal unless explicitly in production with valid credentials
  if (process.env.NODE_ENV === 'production' && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('Using Gmail SMTP');
    // Production: Use Gmail
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    console.log('Using Ethereal Email for testing');
    // Development or missing credentials: Use Ethereal
    const testAccount = await createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
};

const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: process.env.NODE_ENV === 'production'
        ? `\"LGM Support\" <${process.env.EMAIL_USER}>`
        : '\"LGM Support\" <test@example.com>',
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <h1>Password Reset Request</h1>
        <p>Your OTP for password reset is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    
    // Show preview URL in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendOTPEmail
};
