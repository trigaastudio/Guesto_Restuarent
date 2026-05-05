import express from 'express';
import orderController from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, orderController.placeOrder);
router.get('/my-orders', protect, orderController.getMyOrders);
router.put('/:id/cancel', protect, orderController.cancelOrder);
router.put('/:id/status', protect, orderController.updateOrderStatus);

export default router;
