// controllers/userControllers.js
const PersonaInquiry = require('../models/PersonaInquiry');
const { createInquiry } = require('../persona/inquiryController');

// Register user and create a Persona inquiry
exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    // Create Persona inquiry
    const inquiryData = await createInquiry({ firstName, lastName, email });

    // Save inquiry details to DB
    const savedInquiry = new PersonaInquiry({
      inquiryId: inquiryData.data.id,
      status: inquiryData.data.attributes.status,
      referenceId: inquiryData.data.attributes.reference_id,
      userData: { firstName, lastName, email }
    });

    await savedInquiry.save();

    res.status(201).json({
      message: 'User registered and Persona inquiry created',
      inquiryId: inquiryData.data.id,
      referenceId: inquiryData.data.attributes.reference_id
    });
  } catch (err) {
    console.error('Error registering user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get inquiry status by ID
exports.getInquiryStatus = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const inquiry = await PersonaInquiry.findOne({ inquiryId });

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    res.status(200).json(inquiry);
  } catch (err) {
    console.error('Error fetching inquiry:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
