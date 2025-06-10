const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Admin credentials to check
const adminEmail = 'admin@lgmskating.com';
const adminPassword = '6d13d3cada9ff1c22997c751@Lgm2025';

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lgm-skating', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(async () => {
  console.log('Database connection successful');
  
  try {
    // Check if admin exists
    const admin = await User.findOne({ email: adminEmail }).select('+password');
    
    if (!admin) {
      console.log('Admin user not found in database');
      console.log('Creating admin user...');
      
      // Create admin user if it doesn't exist
      const newAdmin = await User.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      
      console.log('Admin user created successfully');
      console.log('Admin details (without password):');
      console.log({
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      });
    } else {
      console.log('Admin user found in database');
      console.log('Admin details:');
      console.log({
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      });
      
      // Check if password matches
      const isMatch = await bcrypt.compare(adminPassword, admin.password);
      
      if (isMatch) {
        console.log('Password is correct');
      } else {
        console.log('Password is incorrect');
        console.log('Updating admin password...');
        
        // Update admin password
        admin.password = adminPassword;
        await admin.save();
        
        console.log('Admin password updated successfully');
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    // Close database connection
    mongoose.connection.close();
    console.log('Database connection closed');
  }
})
.catch(err => {
  console.error('Database connection error:', err);
});
