// routes/authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Register Route (JWT version with auto SMS)
router.post('/signup', async (req, res) => {
  try {
    const { name, phone, username, password } = req.body;
    if (!name || !phone || !username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(409).json({ message: 'User already exists' });

    // Create user
    console.log('Creating new user...');
    const user = new User({ name, phone, username, password });
    await user.save();
    console.log('User saved successfully:', user._id);

    // TEMPORARY: Skip Twilio verification
    console.log('Temporarily bypassing Twilio verification for testing');
    
    // Generate JWT token directly
    const token = generateToken(user._id);
    
    // Return success with token
    return res.status(201).json({ 
      message: 'Account created successfully! [TESTING MODE]',
      token: token,
      testMode: true
    });

    /* Comment out Twilio for now
    // Format phone and send verification code via Twilio
    const formattedPhone = phone.replace(/\D/g, '');
    const internationalPhone = formattedPhone.startsWith('1')
      ? `+${formattedPhone}`
      : `+1${formattedPhone}`;

    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_ID)
      .verifications.create({
        to: internationalPhone,
        channel: 'sms'
      });

    res.status(201).json({ message: 'Account created! Verification code sent.' });
    */
  } catch (err) {
    console.error("Registration failed:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// Send Verification Code
router.post('/send-verification', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  const formattedPhone = phone.replace(/\D/g, '');
  const internationalPhone = formattedPhone.startsWith('1')
    ? `+${formattedPhone}`
    : `+1${formattedPhone}`;

  try {
    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_ID)
      .verifications.create({
        to: internationalPhone,
        channel: 'sms'
      });

    res.status(200).json({ message: 'Verification code sent' });
  } catch (err) {
    console.error('Twilio send verification error:', err.message);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
});

// Verify Code and Generate Token
router.post('/verify-code', async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ message: 'Phone and verification code are required' });
  }

  const formattedPhone = phone.replace(/\D/g, '');
  const internationalPhone = formattedPhone.startsWith('1')
    ? `+${formattedPhone}`
    : `+1${formattedPhone}`;

  try {
    // TEMPORARY: Skip Twilio verification for testing
    console.log('Temporarily bypassing verification check for testing');
    
    // Find the user by phone
    const user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Mark as verified and generate token
    await User.findByIdAndUpdate(user._id, { phone_verified: true });
    const token = generateToken(user._id);
    
    return res.status(200).json({
      message: 'Phone verified successfully [TESTING MODE]',
      token,
      testMode: true
    });

    /* Comment out Twilio verification for now
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_ID)
      .verificationChecks.create({
        to: internationalPhone,
        code
      });

    if (verificationCheck.status === 'approved') {
      const user = await User.findOneAndUpdate(
        { phone },
        { phone_verified: true },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const token = generateToken(user._id);
      return res.status(200).json({
        message: 'Phone verified successfully',
        token
      });
    } else {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
    */
  } catch (err) {
    console.error('Verification error:', err.message);
    return res.status(500).json({ message: 'Verification failed. Try again.' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken(user._id);
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

    router.post('/logout', (req, res) => {
      try {
        console.log('Logging out user...');
        res.status(200).json({ message: 'Logout successful' });
      } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });

module.exports = router;