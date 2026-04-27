import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.registerWithOTP);

export default router;


