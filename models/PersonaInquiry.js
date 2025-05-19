// models/PersonaInquiry.js
const mongoose = require('mongoose');

const PersonaInquirySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inquiryId: {
    type: String,
    required: true
  },
  referenceId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['created', 'completed', 'failed', 'expired', 'reviewing'],
    default: 'created'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  metadata: mongoose.Schema.Types.Mixed // Optional, for additional fields like IP, verification results, etc.
});

module.exports = mongoose.model('PersonaInquiry', PersonaInquirySchema);
