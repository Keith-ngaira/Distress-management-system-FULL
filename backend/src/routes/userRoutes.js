import express from 'express';
import { getCurrentUser, updateUser, getAllUsers, createUser, deleteUser } from '../controllers/userController.js';
import { authenticateToken, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Get current user (any authenticated user can access their own data)
router.get('/me', authenticateToken, getCurrentUser);

// Update current user (any authenticated user can update their own data)
router.put('/me', authenticateToken, updateUser);

// Admin routes - require proper permissions
router.get('/', authenticateToken, checkPermission('users', 'view'), getAllUsers);
router.post('/', authenticateToken, checkPermission('users', 'manage'), createUser);
router.put('/:id', authenticateToken, checkPermission('users', 'manage'), updateUser);
router.delete('/:id', authenticateToken, checkPermission('users', 'manage'), deleteUser);

export default router;
