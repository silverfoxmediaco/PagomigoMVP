// models/UnitAccount.js
const mongoose = require('mongoose');

const unitAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  unitCustomerId: {
    type: String,
    required: true
  },
  unitAccountId: {
    type: String,
    required: true,
    unique: true
  },
  accountType: {
    type: String,
    enum: ['checking', 'savings'],
    default: 'checking'
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'frozen'],
    default: 'open'
  },
  balance: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('UnitAccount', unitAccountSchema);