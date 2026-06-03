import express from 'express';
import rateLimit from 'express-rate-limit';
import staffController from '../controllers/staffController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// HIGH-3 FIX: Staff login now has rate limiting (was completely unrestricted)
const staffAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 attempts per window
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', staffAuthLimiter, staffController.login);

// Admin-only staff management
router.get('/', protect, admin, staffController.getAllStaff);
router.post('/', protect, admin, staffController.createStaff);
router.put('/:id', protect, admin, staffController.updateStaff);
router.delete('/:id', protect, admin, staffController.deleteStaff);

// Credential change (any authenticated staff/admin)
router.post('/request-credential-change', protect, staffController.requestCredentialChange);
router.post('/verify-credential-change', protect, staffController.verifyCredentialChange);

export default router;
