import express from 'express';
import staffController from '../controllers/staffController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', staffController.login);

// Admin only routes
router.get('/', protect, admin, staffController.getAllStaff);
router.post('/', protect, admin, staffController.createStaff);
router.put('/:id', protect, admin, staffController.updateStaff);
router.delete('/:id', protect, admin, staffController.deleteStaff);

// Security Routes (Protected)
router.post('/request-credential-change', protect, staffController.requestCredentialChange);
router.post('/verify-credential-change', protect, staffController.verifyCredentialChange);

export default router;
