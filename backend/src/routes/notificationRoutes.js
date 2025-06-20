import express from 'express';
import {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// Get user's notifications with pagination
router.get('/', authenticateToken, asyncHandler(getUserNotifications));

// Get unread notification count
router.get('/unread-count', authenticateToken, asyncHandler(getUnreadCount));

// Mark a notification as read
router.put('/:id/read', authenticateToken, asyncHandler(markAsRead));

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, asyncHandler(markAllAsRead));

// Delete a notification
router.delete('/:id', authenticateToken, asyncHandler(deleteNotification));

export default router;

export { router as notificationRoutes };
