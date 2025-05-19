// persona/inquiryController.js
const { createInquiry, getInquiry } = require('../models/PersonaInquiry');

// POST /api/persona/inquiry
async function handleCreateInquiry(req, res) {
  try {
    const userData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email
    };

    const inquiry = await createInquiry(userData);
    res.status(201).json({ message: 'Inquiry created', inquiry });
  } catch (err) {
    console.error('Failed to create inquiry:', err.message);
    res.status(500).json({ message: 'Failed to create inquiry', error: err.message });
  }
}

// GET /api/persona/inquiry/:id
async function handleGetInquiry(req, res) {
  try {
    const inquiryId = req.params.id;
    const inquiry = await getInquiry(inquiryId);
    res.status(200).json(inquiry);
  } catch (err) {
    console.error('Failed to retrieve inquiry:', err.message);
    res.status(500).json({ message: 'Failed to retrieve inquiry', error: err.message });
  }
}

module.exports = {
  handleCreateInquiry,
  handleGetInquiry
};

