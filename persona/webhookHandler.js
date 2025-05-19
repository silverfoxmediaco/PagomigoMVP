// persona/webhookHandler.js
const crypto = require('crypto');

// Replace with your actual Persona Webhook Secret from the Dashboard
const PERSONA_WEBHOOK_SECRET = process.env.PERSONA_WEBHOOK_SECRET;

/**
 * Verifies the signature of the incoming Persona webhook request.
 */
function verifySignature(req) {
  const signature = req.headers['persona-signature'];
  const rawBody = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', PERSONA_WEBHOOK_SECRET);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');
  return signature === digest;
}

/**
 * Express handler for Persona webhook events.
 */
function handlePersonaWebhook(req, res) {
  if (!verifySignature(req)) {
    console.warn('⚠️ Invalid Persona webhook signature.');
    return res.status(400).send('Invalid signature');
  }

  const event = req.body;

  console.log('✅ Persona Webhook Received:', event);

  // Example: Handle inquiry completion
  if (event.data.type === 'inquiry' && event.data.attributes.status === 'completed') {
    const inquiryId = event.data.id;
    console.log(`Inquiry ${inquiryId} has been completed.`);
    // TODO: Optionally update your database or trigger follow-up actions
  }

  res.status(200).send('Webhook received');
}

module.exports = { handlePersonaWebhook };
