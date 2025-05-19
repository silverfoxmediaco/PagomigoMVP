const unit = require('unit-sdk');

let token;
try {
  const fs = require('fs');
  token = fs.readFileSync('/etc/secrets/UNIT_API_TOKEN', 'utf8').trim();
} catch (err) {
  console.error('Error reading Unit API token:', err);
  token = process.env.UNIT_API_TOKEN;
}

// Try different initialization approaches
let client;
try {
  // Approach 1: Direct initialization
  client = unit({
    token: token,
    baseURL: process.env.NODE_ENV === 'production' 
      ? 'https://api.unit.co'
      : 'https://api.s.unit.sh'
  });
} catch (e) {
  console.error('First approach failed:', e);
  try {
    // Approach 2: Check if unit is already a client
    client = unit;
    client.setToken(token);
    client.setBaseUrl(process.env.NODE_ENV === 'production' 
      ? 'https://api.unit.co'
      : 'https://api.s.unit.sh');
  } catch (e2) {
    console.error('Second approach failed:', e2);
    // Approach 3: Last resort, use as is
    client = unit;
  }
}

module.exports = client;
