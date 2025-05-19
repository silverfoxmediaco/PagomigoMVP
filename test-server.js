// test-server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

// Only include necessary routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Debug environment variables
console.log('Environment variables loaded:', process.env.MONGO_URI ? 'MONGO_URI is set' : 'MONGO_URI is missing');

// CORS setup
app.use(cors());

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Pagomigo API is alive!' });
});

// Include only necessary routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Fallback to frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Connect to MongoDB Atlas with fallback for testing
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pagomigo';
console.log('Connecting to MongoDB at:', MONGO_URI);

mongoose.connect(MONGO_URI, {})
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB error:', err);
    console.log('Starting server without database connection for testing purposes...');
  });

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});