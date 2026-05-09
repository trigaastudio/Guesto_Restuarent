import express from 'express';
import paymentController from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-order', protect, paymentController.createRazorpayOrder);
router.post('/verify', protect, paymentController.verifyPayment);

export default router;
