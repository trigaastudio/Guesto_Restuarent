import express from 'express';
import orderController from '../controllers/orderController.js';

const router = express.Router();

router.post('/counter', orderController.createCounterOrder);
router.get('/', orderController.getOrders);
router.patch('/:id/status', orderController.updateOrderStatus);
router.patch('/:id/add-items', orderController.addItems);
router.patch('/:id/items', orderController.updateOrderItems);
router.patch('/:orderId/items/:itemId/remove', orderController.removeItem);
router.patch('/:orderId/items/:itemId/status', orderController.updateItemStatus);
router.patch('/:orderId/items/:itemId/quantity', orderController.updateItemQuantity);

export default router;
