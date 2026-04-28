import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
// Preserve admin-login for the dashboard
router.post('/admin-login', authController.adminLogin);

router.post('/google', authController.googleLogin);
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.registerWithOTP);

export default router;


