// persona/personaClient.js
const axios = require('axios');
require('dotenv').config();

const personaClient = axios.create({
  baseURL: 'https://api.withpersona.com/api/v1',
  headers: {
    Authorization: `Bearer ${process.env.PERSONA_API_KEY}`,
    'Persona-Version': process.env.PERSONA_VERSION || '2023-01-05',
    'Content-Type': 'application/json'
  }
});

module.exports = personaClient;
