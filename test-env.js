// Test script to verify environment variables
require('dotenv').config();

console.log('Testing environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set (value hidden)' : 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set (value hidden)' : 'Not set');
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'Set (value hidden)' : 'Not set');
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'Set (value hidden)' : 'Not set');

// Print the actual values for debugging (be careful with sensitive data)
console.log('\nActual values (for debugging only):');
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.substring(0, 3) + '...' : 'Not set');
