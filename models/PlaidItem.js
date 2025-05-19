const mongoose = require('mongoose');

const PlaidItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  access_token: {
    type: String,
    required: true,
  },
  item_id: {
    type: String,
    required: true,
    unique: true,
  },
  institution_name: {
    type: String,
    required: true,
  },
  accounts: [{
    account_id: String,
    name: String,
    mask: String,
    type: String,
    subtype: String,
  }],
  status: {
    type: String,
    enum: ['good', 'error'],
    default: 'good',
  },
  error: {
    type: Object,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Update the timestamp before saving
PlaidItemSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('PlaidItem', PlaidItemSchema);