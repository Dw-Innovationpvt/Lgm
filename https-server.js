/**
 * HTTPS Server Configuration for Production
 * This file configures the server to use HTTPS with proper SSL certificates
 */

const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Enhanced CORS configuration for HTTPS
app.use(cors({
  origin: ['https://dwipl.co.in', 'https://www.dwipl.co.in', 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'Cache-Control', 'Pragma'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection (import from your main server.js)
// ...

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'LGM Skating E-commerce API is running on HTTPS',
    secure: true,
    domain: 'api.dwipl.co.in'
  });
});

// Import your routes here
// ...

// HTTPS server setup
try {
  // Update these paths to your actual SSL certificate locations on EC2
  const privateKey = fs.readFileSync('/etc/ssl/private/your-private-key.key', 'utf8');
  const certificate = fs.readFileSync('/etc/ssl/certs/your-certificate.crt', 'utf8');
  const credentials = { key: privateKey, cert: certificate };
  
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(443, '0.0.0.0', () => {
    console.log('HTTPS Server running on port 443');
  });
} catch (error) {
  console.error('HTTPS server not started:', error.message);
  console.error('Make sure your SSL certificates are properly installed');
}
