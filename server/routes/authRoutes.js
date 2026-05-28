import express from 'express';
import authController from '../controllers/authController.js';
import { validateRegister, validateLogin, validateOTPRegister } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/admin-login', validateLogin, authController.adminLogin);
router.post('/google', authController.googleLogin);
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', validateOTPRegister, authController.registerWithOTP);
router.post('/send-reset-otp', authController.sendPasswordResetOTP);
router.post('/verify-reset-otp', authController.verifyPasswordResetOTP);
router.post('/reset-password', authController.resetPassword);

export default router;
