import express from 'express';
import userController from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/profile', protect, userController.getProfile);
router.post('/avatar', protect, upload.single('avatar'), userController.updateAvatar);
router.post('/address', protect, userController.addAddress);
router.get('/addresses', protect, userController.getAddresses);
router.put('/address/:addressId/default', protect, userController.setDefaultAddress);
router.put('/address/:addressId', protect, userController.updateAddress);
router.put('/change-password', protect, userController.changePassword);
router.delete('/address/:addressId', protect, userController.deleteAddress);

export default router;
