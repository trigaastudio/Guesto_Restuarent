import express from 'express';
import paymentController from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many payment requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/create-order', protect, paymentLimiter, paymentController.createRazorpayOrder);
router.post('/verify', protect, paymentLimiter, paymentController.verifyPayment);

export default router;
