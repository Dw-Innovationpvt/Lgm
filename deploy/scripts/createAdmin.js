const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lgm-skating')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Create admin user directly in the database
async function createAdmin() {
  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Insert admin user directly
    await mongoose.connection.collection('users').insertOne({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date()
    });

    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin user:', error);
    mongoose.disconnect();
  }
}

createAdmin();
