const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false
}));

app.use(express.json());
app.use(morgan('dev'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'LGM Skating E-commerce API is running' });
});

// Simple test routes
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API test endpoint working' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
  });
});

// Define server configuration
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Start HTTP server
app.listen(PORT, HOST, () => {
  console.log(`Minimal HTTP Server running on ${HOST}:${PORT}`);
});
