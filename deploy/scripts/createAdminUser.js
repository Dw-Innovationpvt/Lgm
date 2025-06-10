const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Admin user details
const adminUser = {
  name: 'Admin User',
  email: 'admin@lgmsports.com',
  password: 'admin123',
  role: 'admin'
};

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lgm-skating', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB connected');
  
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminUser.password, salt);
    
    // Create admin user
    const newAdmin = new User({
      name: adminUser.name,
      email: adminUser.email,
      password: hashedPassword,
      role: adminUser.role
    });
    
    await newAdmin.save();
    console.log('Admin user created successfully');
    console.log('Email:', adminUser.email);
    console.log('Password:', adminUser.password);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
