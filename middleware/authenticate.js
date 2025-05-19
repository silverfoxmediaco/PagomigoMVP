// middleware/authenticate.js
const jwt = require('jsonwebtoken');

// Authentication middleware with JWT verification
function authenticate(req, res, next) {
  // Get token from header
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No authentication token, access denied' });
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
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
}

module.exports = authenticate;