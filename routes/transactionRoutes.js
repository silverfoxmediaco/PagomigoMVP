
// routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
//const { sendEmail } = require('../utils/emailService');
const { sendPushNotification } = require('../utils/pushNotificationServices');
//const { sendTransactionNotification } = require('../utils/notificationService');

// @route   POST /api/transactions/send
// @desc    Send money to recipient
// @access  Private

router.post('/send', requireAuth, async (req, res) => {
  try {
    const { recipientPhone, recipientCountry, amountUsd } = req.body;
    const amount = parseFloat(amountUsd);

    //fetch sender authenticated user
    const sender = await User.findById(req.user.id);
    if (!sender) {
      return res.status(404).json({ message: 'Sender not found' });
    }
    // Validate recipient
    //for demo: fetch recipient by phone only
    const recipient = await User.findOne({ phone: recipientPhone });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    // Check sender balance
    if (sender.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    // Deduct amount from sender's balance
    sender.balance -= amount;
    await sender.save();
    // Add amount to recipient's balance
    recipient.balance += amount;
    await recipient.save();
    // Create transaction record
    const transaction = new Transaction({
      senderId: req.user.id,
      recipientId: recipient._id,
      recipientName: recipient.name,
      recipientPhone,
      recipientEmail: recipient.email,
      recipientCountry,
      amountUsd,
      status: 'completed',
      createdAt: new Date()
    }
    );
    await transaction.save();
    // Send email notification to sender
    const emailSubject = 'Transaction Successful';
    const emailBody = `You have successfully sent $${amount} to ${recipient.name}.`;
    await sendEmail(sender.email, emailSubject, emailBody);
    // Send push notification to recipient
    const pushNotificationTitle = 'Money Received';
    const pushNotificationBody = `You have received $${amount} from ${sender.name}.`;
    await sendPushNotification(recipient.deviceToken, pushNotificationTitle, pushNotificationBody);
    // Send in-app notification to recipient
    const notificationMessage = `You have received $${amount} from ${sender.name}.`;
    await sendTransactionNotification(recipient._id, notificationMessage);
    // Send response
    res.status(200).json({
      message: 'Transaction successful',
      transactionId: transaction._id,
      senderBalance: sender.balance,
      recipientBalance: recipient.balance
    }
    );
  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
);

// @route   GET /api/transactions/history
// @desc    Get all transactions by the logged-in user
// @access  Private
router.get('/history', requireAuth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ senderId: req.userId }).sort({ createdAt: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
