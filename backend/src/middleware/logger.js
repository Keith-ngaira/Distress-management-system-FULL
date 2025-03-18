import winston from 'winston';
import expressWinston from 'express-winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Configure winston logger
export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: path.join(logsDir, 'error.log'), 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: path.join(logsDir, 'combined.log')
        })
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Request logging middleware
export const requestLogger = expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}}',
    expressFormat: true,
    colorize: true,
    ignoreRoute: (req) => {
        // Don't log health checks, static files, or favicon requests
        return req.url.startsWith('/health') ||
            req.url.startsWith('/static') ||
            req.url === '/favicon.ico';
    },
    requestWhitelist: ['url', 'method', 'httpVersion', 'originalUrl', 'query'],
    responseWhitelist: ['statusCode', 'responseTime'],
    dynamicMeta: (req, res) => ({
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('user-agent')
    })
});

// Error logging middleware
export const errorLogger = expressWinston.errorLogger({
    winstonInstance: logger,
    meta: true,
    msg: 'HTTP {{err.status}} {{req.method}} {{req.url}}',
    expressFormat: true,
    colorize: true,
    blacklistedMetaFields: ['error', 'trace', 'process', 'os', 'req.headers.cookie'],
    requestWhitelist: ['url', 'method', 'httpVersion', 'originalUrl', 'query'],
    dynamicMeta: (req, res, err) => ({
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        errorCode: err.code,
        errorName: err.name
    })
});

// Audit logger for tracking important operations
export const auditLogger = logger;

// Create audit log entry
export const createAuditLog = async (req, action, details) => {
    const userId = req.user?.id;
    const ip = req.ip;
    const userAgent = req.get('user-agent');
    const timestamp = new Date().toISOString();

    try {
        // Log to database
        await req.app.locals.pool.query(
            `INSERT INTO audit_logs (
                user_id,
                action_type,
                entity_type,
                entity_id,
                old_values,
                new_values,
                ip_address,
                user_agent,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                action.type,
                details.entityType,
                details.entityId,
                JSON.stringify(details.oldValues || null),
                JSON.stringify(details.newValues || null),
                ip,
                userAgent,
                timestamp
            ]
        );

        // Log to file
        auditLogger.info('Audit log created', {
            userId,
            action,
            details,
            ip,
            userAgent,
            timestamp
        });
    } catch (error) {
        console.error('Error creating audit log:', error);
        auditLogger.error('Failed to create audit log', {
            error: error.message,
            errorStack: error.stack,
            userId,
            action,
            details,
            timestamp
        });

        // Don't throw the error to prevent disrupting the main application flow
        // but make sure it's properly logged
        if (process.env.NODE_ENV !== 'production') {
            console.error(error);
        }
    }
};
