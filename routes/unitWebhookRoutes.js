// routes/unitWebhookRoutes.js
/*const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const token = req.headers['x-unit-webhook-token'];
  
  if (token !== process.env.UNIT_WEBHOOK_TOKEN) {
    console.log('Webhook authentication failed: Invalid token');
    return res.status(401).send('Unauthorized');
  }
  
  console.log('Received Unit webhook event:', req.body.type);
  
  try {
    const event = req.body;
    
    switch(event.type) {
      case 'application.created':
        console.log('New application created:', event.data.id);
        break;
        
      case 'application.pending':
        console.log('Application pending:', event.data.id);
        break;
        
      case 'application.approved':
        console.log('Application approved:', event.data.id);
        break;
        
      case 'account.created':
        console.log('New account created:', event.data.id);
        break;
        
      case 'payment.created':
      case 'payment.pending':
      case 'payment.completed':
      case 'payment.returned':
        console.log(`Payment ${event.type.split('.')[1]}:`, event.data.id);
        break;
        
      case 'card.created':
      case 'card.activated':
      case 'card.status.updated':
        console.log(`Card ${event.type.split('.')[1]}:`, event.data.id);
        break;
        
      default:
        console.log('Unhandled event type:', event.type);
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(200).send('Error processed');
  }
});

module.exports = router;
*/