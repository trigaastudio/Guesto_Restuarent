import express from 'express';
import rateLimit from 'express-rate-limit';
import userController from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinaryConfig.js';

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.post('/avatar', protect, upload.single('avatar'), userController.updateAvatar);
router.post('/address', protect, userController.addAddress);
router.get('/addresses', protect, userController.getAddresses);
router.put('/address/:addressId/default', protect, userController.setDefaultAddress);
router.put('/address/:addressId', protect, userController.updateAddress);
router.post('/send-change-email-otp', protect, otpLimiter, userController.sendChangeEmailOTP);
router.post('/send-change-password-otp', protect, otpLimiter, userController.sendChangePasswordOTP);
router.put('/change-email', protect, userController.changeEmail);
router.put('/change-password', protect, userController.changePassword);
router.delete('/address/:addressId', protect, userController.deleteAddress);


router.get('/', protect, userController.getAllUsers);
router.post('/', protect, userController.createUser);
router.put('/:id', protect, userController.updateUser);
router.delete('/:id', protect, userController.deleteUser);
router.patch('/:id/toggle-status', protect, userController.toggleUserStatus);

export default router;
