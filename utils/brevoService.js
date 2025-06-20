/**
 * Brevo (formerly Sendinblue) Email Service
 * This service handles sending emails through Brevo's API
 */

// We'll use the built-in https module for making API requests
const https = require('https');

/**
 * Initialize Brevo service
 * @returns {boolean} Success status
 */
const initializeBrevo = () => {
  console.log('Initializing Brevo email service...');
  console.log('Environment variables check:');
  console.log('- BREVO_API_KEY exists:', !!process.env.BREVO_API_KEY);
  console.log('- BREVO_SENDER_EMAIL exists:', !!process.env.BREVO_SENDER_EMAIL);
  console.log('- BREVO_SENDER_NAME exists:', !!process.env.BREVO_SENDER_NAME);
  
  if (!process.env.BREVO_API_KEY) {
    console.warn('Brevo API key not found. Email sending will not work.');
    return false;
  }

  if (!process.env.BREVO_SENDER_EMAIL) {
    console.warn('Brevo sender email not found. Email sending will not work.');
    return false;
  }

  // Test the API key format
  if (!process.env.BREVO_API_KEY.startsWith('xsmtp')) {
    console.warn('Brevo API key format appears incorrect. Should start with "xsmtp".');
  }

  console.log('Brevo email service initialized successfully with sender:', process.env.BREVO_SENDER_EMAIL);
  return true;
};

/**
 * Send OTP email using Brevo API
 * @param {string} email - Recipient email address
 * @param {string} otp - One-time password
 * @returns {Promise<boolean>} - Success status
 */
const sendOTPEmail = async (email, otp) => {
  try {
    // Check for API key
    if (!process.env.BREVO_API_KEY) {
      console.error('Brevo API key not found');
      return false;
    }

    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@lgmsports.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'LGM Sports';

    // Current year for copyright
    const currentYear = new Date().getFullYear();

    // Prepare email data
    const emailData = {
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: email
        }
      ],
      subject: 'Password Reset OTP',
      htmlContent: `
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
            <p>© ${currentYear} LGM Sports. All rights reserved.</p>
          </div>
        </div>
      `
    };

    // Log the request details for debugging (without API key)
    console.log('Sending email to:', email);
    console.log('Using sender:', senderEmail);
    console.log('API endpoint:', 'https://api.brevo.com/v3/smtp/email');
    
    // Convert emailData to JSON string
    const postData = JSON.stringify(emailData);
    
    // Create promise for https request
    return new Promise((resolve, reject) => {
      // Request options
      const options = {
        hostname: 'api.brevo.com',
        port: 443,
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      // Make the request
      const req = https.request(options, (res) => {
        console.log('Brevo API response status:', res.statusCode);
        
        let data = '';
        
        // A chunk of data has been received
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        // The whole response has been received
        res.on('end', () => {
          try {
            const responseData = JSON.parse(data);
            console.log('Brevo API response data:', responseData);
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log('Email sent successfully to:', email);
              resolve(true);
            } else {
              console.error('Brevo API error:', responseData);
              resolve(false);
            }
          } catch (error) {
            console.error('Error parsing Brevo API response:', error);
            resolve(false);
          }
        });
      });
      
      // Handle errors
      req.on('error', (error) => {
        console.error('Error sending email via Brevo:', error);
        resolve(false);
      });
      
      // Write data to request body
      req.write(postData);
      req.end();
    });
    
    // The Promise will handle the return value
    // We don't need these lines anymore as they're unreachable
    // console.log('Password reset email sent successfully to:', email);
    // return true;
  } catch (error) {
    console.error('Error sending email via Brevo:', error);
    return false;
  }
};

module.exports = {
  initializeBrevo,
  sendOTPEmail
};
