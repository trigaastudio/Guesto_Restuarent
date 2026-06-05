import jwt from 'jsonwebtoken';
import User from '../models/userSchema.js';
import Staff from '../models/staffSchema.js';

export const protect = async (req, res, next) => {
  let token;

  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies) {
    
    token = req.cookies.admin_token || req.cookies.staff_token || req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      
      let user = await User.findById(decoded.id).select('-password');
      if (!user) {
        user = await Staff.findById(decoded.id).select('-password');
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'Not authorized, account not found' });
      }
      
      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Not authorized, account deactivated' });
      }
      
      
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized as an admin' });
  }
};
