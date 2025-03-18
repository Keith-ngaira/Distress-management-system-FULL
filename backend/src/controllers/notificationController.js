import { executeQuery } from '../db.js';
import { logger } from '../middleware/logger.js';

// Get user's notifications
export const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [notifications] = await executeQuery(
            `SELECT * FROM notifications 
            WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [[totalRow]] = await executeQuery(
            `SELECT COUNT(*) as count FROM notifications 
            WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    page,
                    limit,
                    total: totalRow.count,
                    totalPages: Math.ceil(totalRow.count / limit)
                }
            }
        });
    } catch (error) {
        logger.error('Error getting user notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting notifications'
        });
    }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const [[result]] = await executeQuery(
            `SELECT COUNT(*) as count FROM notifications 
            WHERE user_id = ? AND read_at IS NULL 
            AND (expires_at IS NULL OR expires_at > NOW())`,
            [userId]
        );

        res.json({
            success: true,
            data: { count: result.count }
        });
    } catch (error) {
        logger.error('Error getting unread notification count:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting unread count'
        });
    }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [[notification]] = await executeQuery(
            'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await executeQuery(
            'UPDATE notifications SET read_at = NOW() WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        logger.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking notification as read'
        });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await executeQuery(
            `UPDATE notifications 
            SET read_at = NOW() 
            WHERE user_id = ? AND read_at IS NULL`,
            [userId]
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        logger.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking all notifications as read'
        });
    }
};

// Create a new notification
export const createNotification = async (userId, type, title, message, data = null, referenceType = null, referenceId = null, soundEnabled = false, expiresAt = null) => {
    try {
        await executeQuery(
            `INSERT INTO notifications 
            (user_id, type, title, message, data, reference_type, reference_id, sound_enabled, expires_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, type, title, message, JSON.stringify(data), referenceType, referenceId, soundEnabled, expiresAt]
        );

        logger.info(`Created notification for user ${userId}: ${title}`);
        return true;
    } catch (error) {
        logger.error('Error creating notification:', error);
        return false;
    }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [[notification]] = await executeQuery(
            'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await executeQuery(
            'DELETE FROM notifications WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting notification'
        });
    }
};
