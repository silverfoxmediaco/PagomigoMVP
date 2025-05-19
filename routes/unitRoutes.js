// routes/unitRoutes.js
/*const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');
const { authenticateUser } = require('../middleware/auth');

// Test endpoint
router.get('/test', authenticateUser, unitController.testConnection);

// Customer endpoints
router.post('/customers', authenticateUser, unitController.createCustomer);
router.get('/customers/me', authenticateUser, unitController.getMyCustomer);

// Account endpoints
router.post('/accounts', authenticateUser, unitController.createAccount);
router.get('/accounts/me', authenticateUser, unitController.getMyAccount);
router.get('/accounts/balance', authenticateUser, unitController.getAccountBalance);

// Payment endpoints
router.post('/payments/send', authenticateUser, unitController.sendMoney);
router.get('/payments/history', authenticateUser, unitController.getPaymentHistory);

// Webhook handler (no auth needed for webhooks)
router.post('/webhook', express.raw({ type: 'application/json' }), unitController.handleWebhook);

module.exports = router;
*/