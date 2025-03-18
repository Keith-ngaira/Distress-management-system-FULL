import cron from 'node-cron';
import cleanupService from '../services/cleanupService.js';
import { logger } from '../middleware/logger.js';
import pool from '../db.js';

// Schedule cleanup tasks to run at 2 AM every day
cron.schedule('0 2 * * *', async () => {
    logger.info('Starting scheduled cleanup tasks');
    
    try {
        await cleanupService.runAllCleanups(pool);
        logger.info('Scheduled cleanup tasks completed successfully');
    } catch (error) {
        logger.error('Error during scheduled cleanup tasks:', error);
    }
});
