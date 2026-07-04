import express from 'express';
import orderController from '../controllers/orderController.js';
import { protect, admin, adminOrStaff } from '../middleware/authMiddleware.js';

const router = express.Router();


router.post('/validate-cart', protect, orderController.validateCart);
router.post('/', protect, orderController.placeOrder);
router.get('/my-orders', protect, orderController.getMyOrders);
router.put('/:id/cancel', protect, orderController.cancelOrder);




router.get('/', protect, adminOrStaff, orderController.getOrders);                   
router.put('/:id/status', protect, adminOrStaff, orderController.updateOrderStatus);
router.patch('/:id/status', protect, adminOrStaff, orderController.updateOrderStatus);


router.post('/counter', protect, adminOrStaff, orderController.createCounterOrder);
router.patch('/:id/add-items', protect, adminOrStaff, orderController.addItems);
router.patch('/:id/items', protect, adminOrStaff, orderController.updateOrderItems);
router.patch('/:orderId/items/:itemId/remove', protect, adminOrStaff, orderController.removeItem);
router.patch('/:orderId/items/bulk-status', protect, adminOrStaff, orderController.updateAllItemsStatus);
router.patch('/:orderId/items/:itemId/status', protect, adminOrStaff, orderController.updateItemStatus);
router.patch('/:orderId/items/:itemId/quantity', protect, adminOrStaff, orderController.updateItemQuantity);


router.delete('/clear-history', protect, admin, orderController.clearHistory);

export default router;
