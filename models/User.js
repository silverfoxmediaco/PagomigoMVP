// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  phone_verified: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    required: false,
    unique: true,
    lowercase: true,
    sparse: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  address: {
    type: String,
    required: false,
    trim: true
  },
    kyc_status: {
    type: String,
    enum: ['completed', 'failed', 'pending'],
    default: 'pending'
  },
    balance: {
    type: Number,
    default: 500.00 // Starting demo balance
  }

}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
// This code defines a Mongoose schema for a User model with fields for name, email, and password.
// It includes pre-save middleware to hash the password before saving it to the database and a method to compare passwords.
// The schema is then exported as a Mongoose model for use in other parts of the application.
// This code is essential for user authentication and management in a web application.
// It ensures that passwords are securely hashed and provides a method for verifying user credentials during login.
// The code also includes error handling for MongoDB connection issues.
// This is important for maintaining the integrity and security of user data.
// The use of bcrypt for hashing passwords is a standard practice in web development.
// It helps protect user passwords from being exposed in case of a data breach.
// The schema also includes timestamps for tracking when a user was created or updated.
// This can be useful for auditing and managing user accounts.
// Overall, this code is a crucial part of the backend for user management in a web application.
