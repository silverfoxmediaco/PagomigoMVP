const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendPushNotification(toPhone, title, body) {
  try {
    const message = await client.messages.create({
      to: toPhone,
      from: process.env.TWILIO_PHONE_NUMBER, // e.g., "+1415XXXXXXX"
      body: `${title}: ${body}`
    });

    console.log(`SMS sent to ${toPhone}: SID ${message.sid}`);
  } catch (err) {
    console.error('Twilio SMS error:', err.message);
  }
}

module.exports = { sendPushNotification };
