/**
 * Simple Brevo Email Service
 * A minimal implementation for sending emails via Brevo API v3
 */

const https = require('https');

/**
 * Send an email with OTP for password reset
 * @param {string} email - Recipient email address
 * @param {string} otp - One-time password for verification
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async (email, otp) => {
  // Check if API key is available
  if (!process.env.BREVO_API_KEY) {
    console.error('Brevo API key is missing');
    return false;
  }

  // Prepare the email data
  const data = JSON.stringify({
    sender: {
      email: process.env.BREVO_SENDER_EMAIL || 'radhane94@gmail.com',
      name: process.env.BREVO_SENDER_NAME || 'LGM Sports'
    },
    to: [{ email }],
    subject: 'Your Password Reset OTP',
    htmlContent: `<html><body><h1>Your OTP is: ${otp}</h1><p>Use this to reset your password. Valid for 10 minutes.</p></body></html>`
  });

  // Configure the request options
  const options = {
    hostname: 'api.brevo.com',
    port: 443,
    path: '/v3/smtp/email',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY.trim(),
      'Content-Length': data.length
    }
  };

  console.log('Sending email to:', email);
  console.log('Using API key:', process.env.BREVO_API_KEY.substring(0, 10) + '...');

  // Return a promise that resolves when the request completes
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      console.log('Status code:', res.statusCode);
      
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          console.log('Response:', parsedData);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('Email sent successfully');
            resolve(true);
          } else {
            console.error('Failed to send email:', parsedData);
            resolve(false);
          }
        } catch (e) {
          console.error('Error parsing response:', e);
          console.log('Raw response:', responseData);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      resolve(false);
    });
    
    req.write(data);
    req.end();
  });
};

module.exports = { sendEmail };
