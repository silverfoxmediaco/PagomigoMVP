// models/UnitTransaction.js
const mongoose = require('mongoose');

const unitTransactionSchema = new mongoose.Schema({
  unitTransactionId: {
    type: String,
    required: true,
    unique: true
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UnitAccount',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['book', 'ach', 'wire', 'card', 'fee', 'interest', 'other'],
    required: true
  },
  direction: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'returned'],
    default: 'pending'
  },
  counterpartyName: String,
  counterpartyId: String,
  metadata: {
    type: Map,
    of: String
  }
}, { timestamps: true });

module.exports = mongoose.model('UnitTransaction', unitTransactionSchema);
