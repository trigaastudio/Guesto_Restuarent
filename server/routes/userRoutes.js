import express from 'express';
import userController from '../controllers/userController.js';

const router = express.Router();

// Admin only routes for user management
router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/toggle-status', userController.toggleUserStatus);

export default router;
