//New Code
// routes/requestRoutes.js
const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');

// Get all requests sent to the logged-in user
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const requests = await Request.find({ requestedFrom: user.phone })
      .populate('requesterId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    console.error('Fetch requests error:', err);
    res.status(500).json({ message: 'Server error fetching requests' });
  }
});

// Approve request
router.put('/:id/approve', requireAuth, async (req, res) => {
  try {
    const updated = await Request.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    res.json({ message: 'Request approved', request: updated });
  } catch (err) {
    console.error('Approve request error:', err);
    res.status(500).json({ message: 'Failed to approve request' });
  }
});

// Decline request
router.put('/:id/decline', requireAuth, async (req, res) => {
  try {
    const updated = await Request.findByIdAndUpdate(req.params.id, { status: 'declined' }, { new: true });
    res.json({ message: 'Request declined', request: updated });
  } catch (err) {
    console.error('Decline request error:', err);
    res.status(500).json({ message: 'Failed to decline request' });
  }
});

module.exports = router;



//Old code
// routes/requestRoutes.js
/*const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const Request = require('../models/Request');

// @route   POST /api/transactions/request
// @desc    Create a money request
// @access  Private
router.post('/request', requireAuth, async (req, res) => {
  try {
    const { requestedFrom, requestNote, amountUsd } = req.body;

    const request = new Request({
      requesterId: req.user.id,
      requestedFrom,
      requestNote,
      amountUsd,
      status: 'pending'
    });

    await request.save();
    res.status(201).json({ message: 'Request created successfully', request });
  } catch (error) {
    console.error('Request creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/transactions/requests
// @desc    Get requests sent to the current user
// @access  Private

const User = require('../models/User');
router.get('/requests', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const phone = user.phone;
    const requests = await Request.find({ requesterFrom: phone }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error' });

  }
});

// @route   PUT /api/transactions/request/:id/approve
// @desc    Approve a money request
// @access  Private
router.put('/request/:id/approve', requireAuth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.requestedFrom !== req.user.email) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    request.status = 'paid';
    await request.save();

    res.status(200).json({ message: 'Request approved', request });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/transactions/request/:id/decline
// @desc    Decline a money request
// @access  Private
router.put('/request/:id/decline', requireAuth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.requestedFrom !== req.user.email) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    request.status = 'declined';
    await request.save();

    res.status(200).json({ message: 'Request declined', request });
  } catch (error) {
    console.error('Decline request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;*/
