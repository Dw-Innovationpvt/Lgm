const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
