import express from 'express';
import orderController from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();


router.post('/validate-cart', protect, orderController.validateCart);
router.post('/', protect, orderController.placeOrder);
router.get('/my-orders', protect, orderController.getMyOrders);
router.put('/:id/cancel', protect, orderController.cancelOrder);




router.get('/', protect, admin, orderController.getOrders);                   
router.put('/:id/status', protect, admin, orderController.updateOrderStatus);
router.patch('/:id/status', protect, admin, orderController.updateOrderStatus);


router.post('/counter', protect, orderController.createCounterOrder);
router.patch('/:id/add-items', protect, orderController.addItems);
router.patch('/:id/items', protect, orderController.updateOrderItems);
router.patch('/:orderId/items/:itemId/remove', protect, orderController.removeItem);
router.patch('/:orderId/items/bulk-status', protect, orderController.updateAllItemsStatus);
router.patch('/:orderId/items/:itemId/status', protect, orderController.updateItemStatus);
router.patch('/:orderId/items/:itemId/quantity', protect, orderController.updateItemQuantity);


router.delete('/clear-history', protect, admin, orderController.clearHistory);

export default router;
