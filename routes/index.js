// routes/index.js
const express = require('express');
const router = express.Router();

// Import all route modules
const personaRoutes = require('../persona/personaRoutes');
const userRoutes = require('./userRoutes');

// Mount routes
router.use('/persona', personaRoutes);
router.use('/users', userRoutes); // Example: /users/register, /users/inquiry/:id

module.exports = router;
