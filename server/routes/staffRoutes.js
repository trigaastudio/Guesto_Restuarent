import express from 'express';
import rateLimit from 'express-rate-limit';
import staffController from '../controllers/staffController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();


const staffAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,                    
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', staffAuthLimiter, staffController.login);


router.get('/', protect, admin, staffController.getAllStaff);
router.post('/', protect, admin, staffController.createStaff);
router.put('/:id', protect, admin, staffController.updateStaff);
router.delete('/:id', protect, admin, staffController.deleteStaff);


router.post('/request-credential-change', protect, staffController.requestCredentialChange);
router.post('/verify-credential-change', protect, staffController.verifyCredentialChange);

export default router;
