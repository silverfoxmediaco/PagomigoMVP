const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRY, JWT_ISSUER, JWT_AUDIENCE, JWT_ALGORITHM } = require('../config/auth');

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRY,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: JWT_ALGORITHM,
    }
  );
};

const authenticateUser = (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    // Verify the token using JWT_SECRET from config
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    
    // Set user info from decoded token
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = { authenticateUser, generateToken };