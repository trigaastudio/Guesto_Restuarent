import express from 'express';
import orderController from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─── USER FACING (Authenticated) ────────────────────────────────────────────
router.post('/validate-cart', orderController.validateCart);           // Public OK
router.post('/', protect, orderController.placeOrder);
router.get('/my-orders', protect, orderController.getMyOrders);
router.put('/:id/cancel', protect, orderController.cancelOrder);

// ─── ADMIN / STAFF ORDER MANAGEMENT ─────────────────────────────────────────
// CRIT-6 FIX: All routes below were completely unauthenticated — now protected

router.get('/', protect, orderController.getOrders);                   // Staff/Admin list all orders
router.put('/:id/status', protect, orderController.updateOrderStatus);
router.patch('/:id/status', protect, orderController.updateOrderStatus);

// Counter/POS orders — require authentication (staff or admin)
router.post('/counter', protect, orderController.createCounterOrder);
router.patch('/:id/add-items', protect, orderController.addItems);
router.patch('/:id/items', protect, orderController.updateOrderItems);
router.patch('/:orderId/items/:itemId/remove', protect, orderController.removeItem);
router.patch('/:orderId/items/bulk-status', protect, orderController.updateAllItemsStatus);
router.patch('/:orderId/items/:itemId/status', protect, orderController.updateItemStatus);
router.patch('/:orderId/items/:itemId/quantity', protect, orderController.updateItemQuantity);

// Destructive admin-only operation
router.delete('/clear-history', protect, admin, orderController.clearHistory);

export default router;
