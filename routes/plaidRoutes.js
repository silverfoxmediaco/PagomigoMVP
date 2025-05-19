// plaidRoutes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate'); 
const PlaidItem = require('../models/PlaidItem'); 
const User = require('../models/User'); 
const { plaidClient } = require('../config/plaid'); 
const PlaidIdentityVerification = require('../models/PlaidIdentityVerification');

// Route to create a link token for connecting bank accounts
router.post('/create-link-token', authenticate, async (req, res) => {
  try {
    const clientUserId = req.user.id;

    const createTokenResponse = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: clientUserId,
      },
      client_name: 'Pagomigo',
      products: ['auth', 'transactions'],
      country_codes: ['US'],
      language: 'en',
    });

    res.json({ link_token: createTokenResponse.data.link_token });
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

// Route to create a link token for identity verification
router.post('/create-idv-link-token', authenticate, async (req, res) => {
  try {
    const createTokenResponse = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: req.user.id,
      },
      client_name: 'Pagomigo',
      products: ['identity_verification'],
      language: 'en',
      country_codes: ['US'], // Add other countries as needed
      identity_verification: {
        template_id: 'idvtmp_38vvseLjfJRf6o',
        is_idempotent: false, // Set to true in production
      },
    });

    res.json({ link_token: createTokenResponse.data.link_token });
  } catch (error) {
    console.error('Error creating IDV link token:', error);
    res.status(500).json({ error: 'Failed to create IDV link token' });
  }
});

// Exchange public token for access token (after bank account connection)
router.post('/exchange-token', authenticate, async (req, res) => {
  try {
    const { public_token, institution_name } = req.body;
    
    // Exchange public token for an access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: public_token
    });
    
    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;
    
    // Get account info
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken
    });
    
    const accounts = accountsResponse.data.accounts.map(account => ({
      account_id: account.account_id,
      name: account.name,
      mask: account.mask,
      type: account.type,
      subtype: account.subtype
    }));
    
    // Save to database
    const plaidItem = new PlaidItem({
      user: req.user.id,
      access_token: accessToken,
      item_id: itemId,
      institution_name: institution_name,
      accounts: accounts
    });
    
    await plaidItem.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).json({ error: 'Failed to connect bank account' });
  }
});

// Complete identity verification
router.post('/complete-idv', authenticate, async (req, res) => {
  try {
    const { identity_verification_id } = req.body;
    
    // Get the status of the verification
    const response = await plaidClient.identityVerificationGet({
      identity_verification_id: identity_verification_id
    });
    
    // Save verification status
    const verification = new PlaidIdentityVerification({
      user: req.user.id,
      identity_verification_id: identity_verification_id,
      status: response.data.status
    });
    
    await verification.save();
    
    // Update user's verification status if needed
    await User.findByIdAndUpdate(req.user.id, {
      identity_verified: response.data.status === 'success'
    });
    
    res.json({ success: true, status: response.data.status });
  } catch (error) {
    console.error('Error completing identity verification:', error);
    res.status(500).json({ error: 'Failed to complete identity verification' });
  }
});

// Get verification status - ADDED THIS ENDPOINT
router.get('/verification-status', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user has completed verification with Plaid
    const verification = await PlaidIdentityVerification.findOne({ 
      user: userId 
    }).sort({ timestamp: -1 }); // Get the most recent one
    
    if (!verification) {
      return res.json({
        status: 'pending',
        message: 'Verification not started'
      });
    }
    
    res.json({
      status: verification.status,
      updatedAt: verification.timestamp.toISOString()
    });
    
  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

// Get connected accounts
router.get('/accounts', authenticate, async (req, res) => {
  try {
    const plaidItems = await PlaidItem.find({ user: req.user.id });
    
    const accounts = [];
    
    for (const item of plaidItems) {
      for (const account of item.accounts) {
        accounts.push({
          id: account.account_id,
          name: account.name,
          mask: account.mask,
          type: account.type,
          subtype: account.subtype,
          institution: item.institution_name,
          item_id: item.item_id
        });
      }
    }
    
    res.json({ accounts });
  } catch (error) {
    console.error('Error getting accounts:', error);
    res.status(500).json({ error: 'Failed to get accounts' });
  }
});

// Get account balance
router.get('/balance/:accountId', authenticate, async (req, res) => {
  try {
    const accountId = req.params.accountId;
    
    // Find the Plaid item containing this account
    const plaidItem = await PlaidItem.findOne({ 
      user: req.user.id,
      'accounts.account_id': accountId
    });
    
    if (!plaidItem) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Get balance from Plaid
    const balanceResponse = await plaidClient.accountsBalanceGet({
      access_token: plaidItem.access_token,
      options: {
        account_ids: [accountId]
      }
    });
    
    const account = balanceResponse.data.accounts[0];
    
    res.json({
      balance: {
        current: account.balances.current,
        available: account.balances.available,
        currency: account.balances.iso_currency_code
      }
    });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

module.exports = router;