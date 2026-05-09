import express from 'express';
import userController from '../controllers/userController.js';
<<<<<<< HEAD
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
=======

const router = express.Router();

// Admin only routes for user management
router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/toggle-status', userController.toggleUserStatus);
>>>>>>> develop

export default router;
