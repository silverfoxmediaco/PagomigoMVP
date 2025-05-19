// middleware/requireAuth.js

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');

module.exports = (req, res, next) => {
  // Get token from header
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No authentication token, access denied' });
  }

  try {
    // Verify the token using JWT_SECRET from config
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    
    // Set userId from decoded token to maintain consistency with how this middleware is used
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};