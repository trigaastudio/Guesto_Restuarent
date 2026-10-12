import express from 'express';
import { getDailyExpenses } from '../controllers/expenseController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected for admin
router.use(protect, admin);

router.get('/daily', getDailyExpenses);

export default router;
