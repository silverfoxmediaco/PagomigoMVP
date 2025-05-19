//config/auth.js
module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || 'supersecretkey',
    JWT_EXPIRY: '7d', // 7 days
    JWT_ISSUER: 'pagomigo.com',
    JWT_AUDIENCE: 'pagomigo.com',
    JWT_ALGORITHM: 'HS256'
};