import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, admin, dashboardController.getStats);

export default router;
