import express from 'express';
import cartController from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();


router.use(protect);

router.route('/')
  .post(cartController.addToCart)
  .get(cartController.getCart)
  .delete(cartController.clearCart);

router.route('/:id')
  .put(cartController.updateQuantity)
  .delete(cartController.removeFromCart);

export default router;
