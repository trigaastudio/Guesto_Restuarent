import express from 'express';
import orderController from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// User Routes
router.post('/', protect, orderController.placeOrder);
router.get('/my-orders', protect, orderController.getMyOrders);
router.put('/:id/cancel', protect, orderController.cancelOrder);

// Shared / Admin Routes
router.get('/', orderController.getOrders);
router.put('/:id/status', orderController.updateOrderStatus);
router.patch('/:id/status', orderController.updateOrderStatus);

// Counter / Item Management (from develop)
router.post('/counter', orderController.createCounterOrder);
router.patch('/:id/add-items', orderController.addItems);
router.patch('/:id/items', orderController.updateOrderItems);
router.patch('/:orderId/items/:itemId/remove', orderController.removeItem);
router.patch('/:orderId/items/:itemId/status', orderController.updateItemStatus);
router.patch('/:orderId/items/:itemId/quantity', orderController.updateItemQuantity);
router.delete('/clear-history', orderController.clearHistory);

export default router;
