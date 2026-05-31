import express from 'express';
import rateLimit from 'express-rate-limit';
import authController from '../controllers/authController.js';
import { validateRegister, validateLogin, validateOTPRegister } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Strict rate limiting for sensitive auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, validateRegister, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/admin-login', authLimiter, validateLogin, authController.adminLogin);
router.post('/google', authController.googleLogin);
router.post('/send-otp', authLimiter, authController.sendOTP);
router.post('/verify-otp', authLimiter, validateOTPRegister, authController.registerWithOTP);
router.post('/send-reset-otp', authLimiter, authController.sendPasswordResetOTP);
router.post('/verify-reset-otp', authLimiter, authController.verifyPasswordResetOTP);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.post('/logout', authController.logout);

export default router;
