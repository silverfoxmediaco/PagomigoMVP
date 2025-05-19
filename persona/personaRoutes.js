// persona/personaRoutes.js
const express = require('express');
const router = express.Router();

const {
  handleCreateInquiry,
  handleGetInquiry
} = require('./inquiryController');

// Create a new Persona inquiry
router.post('/inquiry', handleCreateInquiry);

// Retrieve an existing inquiry by ID
router.get('/inquiry/:id', handleGetInquiry);

module.exports = router;
