import { logger } from '../middleware/logger.js';
import fs from 'fs/promises';
import path from 'path';

class CleanupService {
    constructor() {
        this.RETENTION_PERIODS = {
            notifications: 30 * 24 * 60 * 60 * 1000, // 30 days
            audit_logs: 180 * 24 * 60 * 60 * 1000,  // 180 days
            attachments: 365 * 24 * 60 * 60 * 1000  // 1 year
        };
    }

    async cleanupNotifications(pool) {
        try {
            const cutoffDate = new Date(Date.now() - this.RETENTION_PERIODS.notifications);
            
            // Delete old read notifications
            const [result] = await pool.execute(
                'DELETE FROM notifications WHERE read_at IS NOT NULL AND created_at < ?',
                [cutoffDate]
            );

            // Update cleanup events
            await this.updateCleanupEvent(pool, 'notifications', result.affectedRows);
            
            logger.info(`Cleaned up ${result.affectedRows} old notifications`);
            return result.affectedRows;
        } catch (error) {
            logger.error('Error cleaning up notifications:', error);
            throw error;
        }
    }

    async cleanupAuditLogs(pool) {
        try {
            const cutoffDate = new Date(Date.now() - this.RETENTION_PERIODS.audit_logs);
            
            const [result] = await pool.execute(
                'DELETE FROM audit_logs WHERE created_at < ?',
                [cutoffDate]
            );

            await this.updateCleanupEvent(pool, 'audit_logs', result.affectedRows);
            
            logger.info(`Cleaned up ${result.affectedRows} old audit logs`);
            return result.affectedRows;
        } catch (error) {
            logger.error('Error cleaning up audit logs:', error);
            throw error;
        }
    }

    async cleanupOrphanedFiles(pool) {
        try {
            const uploadsDir = path.join(process.cwd(), 'uploads');
            const files = await fs.readdir(uploadsDir);
            let deletedCount = 0;

            for (const file of files) {
                const filePath = path.join(uploadsDir, file);
                
                // Check if file exists in database
                const [rows] = await pool.execute(
                    'SELECT id FROM attachments WHERE file_path = ?',
                    [filePath]
                );

                if (rows.length === 0) {
                    await fs.unlink(filePath);
                    deletedCount++;
                    logger.info(`Deleted orphaned file: ${file}`);
                }
            }

            await this.updateCleanupEvent(pool, 'orphaned_files', deletedCount);
            
            logger.info(`Cleaned up ${deletedCount} orphaned files`);
            return deletedCount;
        } catch (error) {
            logger.error('Error cleaning up orphaned files:', error);
            throw error;
        }
    }

    async cleanupOldAttachments(pool) {
        try {
            const cutoffDate = new Date(Date.now() - this.RETENTION_PERIODS.attachments);
            
            // Get attachments to delete
            const [attachments] = await pool.execute(
                `SELECT a.* FROM attachments a
                LEFT JOIN distress_messages d ON a.distress_message_id = d.id
                WHERE d.status = 'resolved' AND d.resolved_at < ?`,
                [cutoffDate]
            );

            let deletedCount = 0;
            for (const attachment of attachments) {
                try {
                    // Delete file
                    await fs.unlink(attachment.file_path);
                    
                    // Delete database record
                    await pool.execute(
                        'DELETE FROM attachments WHERE id = ?',
                        [attachment.id]
                    );
                    
                    deletedCount++;
                } catch (error) {
                    logger.error(`Error deleting attachment ${attachment.id}:`, error);
                }
            }

            await this.updateCleanupEvent(pool, 'old_attachments', deletedCount);
            
            logger.info(`Cleaned up ${deletedCount} old attachments`);
            return deletedCount;
        } catch (error) {
            logger.error('Error cleaning up old attachments:', error);
            throw error;
        }
    }

    async updateCleanupEvent(pool, eventType, affectedRows, error = null) {
        const nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000); // Next day
        
        await pool.execute(
            `INSERT INTO cleanup_events 
            (event_type, last_run, next_run, status, affected_rows, error_message) 
            VALUES (?, NOW(), ?, ?, ?, ?)`,
            [eventType, nextRun, error ? 'error' : 'completed', affectedRows, error?.message]
        );
    }

    async runAllCleanups(pool) {
        logger.info('Starting cleanup tasks');
        
        try {
            await this.cleanupNotifications(pool);
            await this.cleanupAuditLogs(pool);
            await this.cleanupOrphanedFiles(pool);
            await this.cleanupOldAttachments(pool);
            
            logger.info('All cleanup tasks completed successfully');
        } catch (error) {
            logger.error('Error during cleanup tasks:', error);
            throw error;
        }
    }
}

export default new CleanupService();
