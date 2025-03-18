import mysql from 'mysql2/promise';
import { logger } from './middleware/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'management',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true,
    namedPlaceholders: true,
    // Add authentication plugin to handle MySQL 8+ auth
    authPlugins: {
        mysql_native_password: () => () => {
            return Buffer.from(process.env.DB_PASSWORD || '')
        }
    }
};

logger.info('Creating database connection pool');
const pool = mysql.createPool(poolConfig);

// Execute a query with error handling
const executeQuery = async (sql, params = {}) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [results] = await connection.execute(sql, params);
        return results;
    } catch (error) {
        logger.error('Query execution error:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Test the connection on startup
(async () => {
    try {
        logger.info('Testing database connection');
        const connection = await pool.getConnection();
        await connection.query('SELECT 1');
        connection.release();
        logger.info('Database connection test successful');
    } catch (error) {
        logger.error('Database connection test failed:', error);
        // Don't exit on connection failure, allow retries
        logger.info('Will retry database connection on next query');
    }
})();

export { pool as default, executeQuery };
