import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import db, { executeQuery } from './db.js';
import { revokeToken } from './middleware/auth.js';
import authRoutes from './routes/authRoutes.js';
import attachmentRoutes from './routes/attachmentRoutes.js';
import distressRoutes from './routes/distressRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { requestLogger, errorLogger, logger } from './middleware/logger.js';
import { authenticateToken } from './middleware/auth.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';
import dotenv from 'dotenv';

// Load environment variables (single source of truth)
dotenv.config();

logger.info('Starting app initialization');

const app = express();
const server = http.createServer(app);

// Basic security headers with updated CSP for development
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP in development
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false
}));

// Rate limiting - More lenient for development
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // increase max requests for development
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});

// Auth rate limiting - More lenient for development
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // increase max attempts for development
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again later.'
    }
});

// CORS configuration
const corsOptions = {
    origin: function(origin, callback) {
        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
            callback(null, true);
            return;
        }

        const allowedOrigins = [
            'http://localhost:3002',
            'http://127.0.0.1:3002'
        ];
        
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logger.error(`Origin ${origin} not allowed by CORS`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204
};

// Apply CORS configuration before other middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Apply rate limiting - Only apply to auth routes in development
app.use('/api/auth', authLimiter);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
    logger.info('Logs directory created');
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    logger.info('Uploads directory created');
}

// Health check endpoint (before any middleware)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.use(requestLogger);

// Auth routes (no authentication required)
app.use('/api/auth', authRoutes);

// Protected routes (authentication required)
app.use('/api/attachments', authenticateToken, attachmentRoutes);
app.use('/api/distress-messages', authenticateToken, distressRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);

// Error handling
app.use(errorLogger);
app.use((err, req, res, next) => {
    logger.error('Error handler:', err);
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.errors
        });
    }
    
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: 'Authentication error',
            error: err.message
        });
    }

    // Generic error handler
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 handler
app.use((req, res) => {
    logger.warn('404 Not Found:', req.path);
    res.status(404).json({
        success: false,
        message: 'Resource not found'
    });
});

logger.info('App initialization completed');

export { app, server };
