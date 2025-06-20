/**
 * Simple test script to verify Brevo API credentials
 * Run this with: node emailTest.js
 */

// Load environment variables
require('dotenv').config();
const https = require('https');

// Get API key from environment
const apiKey = process.env.BREVO_API_KEY;
console.log('API Key length:', apiKey ? apiKey.length : 'not found');
console.log('API Key first 10 chars:', apiKey ? apiKey.substring(0, 10) + '...' : 'not found');

// Email data
const emailData = {
  sender: {
    email: process.env.BREVO_SENDER_EMAIL || 'radhane94@gmail.com',
    name: process.env.BREVO_SENDER_NAME || 'LGM Sports'
  },
  to: [{ email: 'swarajpatil644@gmail.com' }],
  subject: 'Test Email from Brevo',
  htmlContent: '<html><body><h1>This is a test email</h1><p>If you received this, the Brevo API is working correctly.</p></body></html>'
};

// Convert to JSON string
const postData = JSON.stringify(emailData);

// Request options
const options = {
  hostname: 'api.brevo.com',
  port: 443,
  path: '/v3/smtp/email',
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'api-key': apiKey,
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Making request to Brevo API...');
console.log('Headers:', JSON.stringify(options.headers, null, 2).replace(apiKey, '[REDACTED]'));

// Make the request
const req = https.request(options, (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const responseData = JSON.parse(data);
      console.log('Response data:', responseData);
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('Email sent successfully!');
      } else {
        console.error('Failed to send email:', responseData);
      }
    } catch (e) {
      console.error('Error parsing response:', e);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(postData);
req.end();

console.log('Request sent, waiting for response...');
