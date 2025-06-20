const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Basic middleware
app.use(cors({
  origin: [
    'https://dwipl.co.in',
    'https://www.dwipl.co.in',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173', // Vite preview
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-Request-ID', 'cache-control', 'pragma'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lgm-skating', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('Database connection successful');
})
.catch(err => {
  console.error('Database connection error:', err);
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'LGM Skating E-commerce API is running' });
});

// Load routes
const loadRoute = (routePath, routeFile) => {
  try {
    const router = require(routeFile);
    app.use(routePath, router);
    console.log(`Route loaded: ${routePath}`);
    return true;
  } catch (error) {
    console.error(`Failed to load route ${routePath}:`, error.message);
    return false;
  }
};

// Load all routes
loadRoute('/api/auth', './routes/auth'); // Auth routes should be loaded first
loadRoute('/api/products', './routes/products');
loadRoute('/api/categories', './routes/categories');
loadRoute('/api/users', './routes/users');
loadRoute('/api/orders', './routes/orders');
loadRoute('/api/cart', './routes/cart');
loadRoute('/api/payments', './routes/payments');
loadRoute('/api/notifications', './routes/notifications');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
  });
});

// Start HTTP server
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// HTTPS setup for AWS (commented out for local development)
/*
To enable HTTPS on AWS:
1. Install SSL certificates on your EC2 instance
2. Uncomment the code below
3. Update the paths to your certificate files
4. Run with sudo to bind to port 443

const https = require('https');
const fs = require('fs');

try {
  const privateKey = fs.readFileSync('/etc/ssl/private/selfsigned.key', 'utf8');
  const certificate = fs.readFileSync('/etc/ssl/certs/selfsigned.crt', 'utf8');
  const credentials = { key: privateKey, cert: certificate };
  
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(443, '0.0.0.0', () => {
    console.log('HTTPS Server running on port 443');
  });
} catch (error) {
  console.error('HTTPS server not started:', error.message);
}
*/
