import jwt from 'jsonwebtoken';
import User from '../models/userSchema.js';
<<<<<<< HEAD
=======
import Staff from '../models/staffSchema.js';
>>>>>>> develop

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
<<<<<<< HEAD
      
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }
      
      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
=======

      // Check both User and Staff collections
      let user = await User.findById(decoded.id);
      if (!user) {
        user = await Staff.findById(decoded.id);
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'Not authorized, account not found' });
      }
      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
>>>>>>> develop
    }
  }

  if (!token) {
<<<<<<< HEAD
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
=======
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized as an admin' });
>>>>>>> develop
  }
};
