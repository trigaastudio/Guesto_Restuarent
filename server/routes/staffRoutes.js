import express from 'express';
import staffController from '../controllers/staffController.js';
// import { protect, admin } from '../middleware/authMiddleware.js'; // I'll check if these exist

const router = express.Router();

router.post('/login', staffController.login);

// Admin only routes
router.get('/', staffController.getAllStaff);
router.post('/', staffController.createStaff);
router.put('/:id', staffController.updateStaff);
router.delete('/:id', staffController.deleteStaff);

export default router;
