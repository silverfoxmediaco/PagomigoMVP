const unitService = require('../services/unitService');
const User = require('../models/User');
const UnitAccount = require('../models/UnitAccount');
const UnitTransaction = require('../models/UnitTransaction');

exports.testConnection = async (req, res) => {
  try {
    const accounts = await unitService.listAccounts({
      page: { limit: 1 }
    });
    
    res.json({
      success: true,
      message: 'Unit SDK connection successful',
      data: accounts
    });
  } catch (error) {
    console.error('Unit connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to Unit',
      error: error.message
    });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.unitCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'User already has a Unit customer profile'
      });
    }
    
    const customerData = {
      firstName: req.body.firstName || user.firstName,
      lastName: req.body.lastName || user.lastName,
      ssn: req.body.ssn,
      dateOfBirth: req.body.dateOfBirth,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      email: user.email,
      phone: user.phone
    };
    
    const customer = await unitService.createCustomer(customerData);
    
    user.unitCustomerId = customer.id;
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'Unit customer created successfully',
      data: {
        customerId: customer.id
      }
    });
  } catch (error) {
    console.error('Error creating Unit customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Unit customer',
      error: error.message
    });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const token = req.headers['x-unit-webhook-token'];
    if (token !== process.env.UNIT_WEBHOOK_TOKEN) {
      console.log('Webhook authentication failed: Invalid token');
      return res.status(401).send('Unauthorized');
    }
    
    const event = JSON.parse(req.body.toString());
    console.log('Received Unit webhook:', event.type);
    
    switch (event.type) {
      case 'application.created':
        console.log('New application created:', event.data.id);
        break;
        
      case 'application.pending':
      case 'application.approved':
      case 'application.denied':
        await processApplicationStatus(event.data);
        break;
      
      case 'account.created':
        await processAccountCreated(event.data);
        break;
      
      case 'account.closed':
        await processAccountClosed(event.data);
        break;
      
      case 'payment.state.completed':
        await processCompletedPayment(event.data);
        break;
      
      case 'payment.state.returned':
        await processReturnedPayment(event.data);
        break;
      
      case 'card.created':
      case 'card.activated':
      case 'card.status.updated':
        await processCardEvent(event.type, event.data);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing Unit webhook:', error);
    res.status(200).send('Webhook received, processing error logged');
  }
};

async function processApplicationStatus(data) {
  console.log(`Application ${data.id} status: ${data.attributes.status}`);
}

async function processAccountCreated(data) {
  try {
    const customerId = data.relationships.customer.id;
    const user = await User.findOne({ unitCustomerId: customerId });
    
    if (!user) {
      console.log(`No user found for Unit customer ID: ${customerId}`);
      return;
    }
    
    const account = new UnitAccount({
      userId: user._id,
      unitAccountId: data.id,
      unitCustomerId: customerId,
      type: data.attributes.type,
      status: data.attributes.status,
      createdAt: new Date()
    });
    
    await account.save();
    console.log(`Account ${data.id} created and saved to database`);
  } catch (error) {
    console.error('Error processing account creation:', error);
  }
}

async function processAccountClosed(data) {
  try {
    await UnitAccount.findOneAndUpdate(
      { unitAccountId: data.id },
      { 
        status: data.attributes.status,
        closedAt: new Date()
      }
    );
    console.log(`Account ${data.id} marked as closed`);
  } catch (error) {
    console.error('Error processing account closure:', error);
  }
}

async function processCompletedPayment(data) {
  try {
    const accountId = data.relationships.account.id;
    const unitAccount = await UnitAccount.findOne({ unitAccountId: accountId });
    
    if (!unitAccount) {
      console.log(`No account found for Unit account ID: ${accountId}`);
      return;
    }
    
    const transaction = new UnitTransaction({
      userId: unitAccount.userId,
      unitAccountId: accountId,
      unitTransactionId: data.id,
      type: data.attributes.type,
      amount: data.attributes.amount,
      direction: data.attributes.direction,
      status: 'completed',
      description: data.attributes.description,
      createdAt: new Date(data.attributes.createdAt)
    });
    
    await transaction.save();
    console.log(`Payment ${data.id} recorded as completed transaction`);
  } catch (error) {
    console.error('Error processing completed payment:', error);
  }
}

async function processReturnedPayment(data) {
  try {
    await UnitTransaction.findOneAndUpdate(
      { unitTransactionId: data.id },
      { 
        status: 'returned',
        returnReason: data.attributes.returnReason
      }
    );
    console.log(`Payment ${data.id} marked as returned`);
  } catch (error) {
    console.error('Error processing returned payment:', error);
  }
}

async function processCardEvent(eventType, data) {
  const eventAction = eventType.split('.').pop();
  console.log(`Card ${data.id} event: ${eventAction}`);
}
