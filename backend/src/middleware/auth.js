import jwt from 'jsonwebtoken';
import db, { executeQuery } from '../db.js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { logger } from './logger.js';

dotenv.config();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const TOKEN_ISSUER = process.env.TOKEN_ISSUER || 'distress-management-system';
const MAX_TOKEN_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Role permissions
const rolePermissions = {
    admin: {
        dashboard: ['view'],
        users: ['manage', 'view'],
        roles: ['manage', 'view'],
        cases: ['manage', 'assign', 'view'],
        reports: ['view']
    },
    director: {
        dashboard: ['view'],
        cases: ['manage', 'assign', 'view'],
        reports: ['view']
    },
    front_office: {
        cases: ['create', 'view', 'update']
    },
    cadet: {
        cases: ['view_assigned', 'update_assigned']
    }
};

// Token blacklist (for logged out tokens)
const tokenBlacklist = new Set();

// Rate limiting for failed attempts (more lenient for development)
const failedAttempts = new Map();
const MAX_FAILED_ATTEMPTS = process.env.NODE_ENV === 'development' ? 20 : 5;
const LOCKOUT_DURATION = process.env.NODE_ENV === 'development' ? 5 * 60 * 1000 : 15 * 60 * 1000; // 5 mins in dev, 15 mins in prod

// Role hierarchy for permission inheritance
const roleHierarchy = {
    admin: ['director', 'front_office', 'cadet'],
    director: ['front_office', 'cadet'],
    front_office: ['cadet'],
    cadet: []
};

export const generateToken = (user) => {
    // Generate a random session ID
    const sessionId = crypto.randomBytes(32).toString('hex');
    
    const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
        sessionId
    };

    const options = {
        expiresIn: JWT_EXPIRES_IN,
        issuer: TOKEN_ISSUER,
        audience: 'distress-management-api',
        subject: user.id.toString(),
        algorithm: 'HS256',
        notBefore: 0 // Token valid immediately
    };

    return jwt.sign(payload, JWT_SECRET, options);
};

// Authenticate JWT token middleware
export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            logger.warn('No token provided');
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check if token is blacklisted
        if (tokenBlacklist.has(token)) {
            logger.warn('Token is blacklisted');
            return res.status(401).json({
                success: false,
                message: 'Token is no longer valid'
            });
        }

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                logger.error('Token verification failed:', err);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
            }

            // Check token expiration
            if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
                logger.warn('Token has expired');
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired'
                });
            }

            req.user = decoded;
            next();
        });
    } catch (error) {
        logger.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication'
        });
    }
};

// Authorize based on role permissions
export const authorize = (requiredPermissions) => {
    return (req, res, next) => {
        const userRole = req.user.role;
        const userPermissions = rolePermissions[userRole] || {};

        const hasAllPermissions = requiredPermissions.every(
            permission => {
                const [resource, action] = permission.split('.');
                return userPermissions[resource]?.includes(action);
            }
        );

        if (!hasAllPermissions) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

// Revoke token (add to blacklist)
export const revokeToken = (token) => {
    tokenBlacklist.add(token);
    // Remove token after it expires
    setTimeout(() => {
        tokenBlacklist.delete(token);
    }, 24 * 60 * 60 * 1000); // 24 hours
};

const isIpBlocked = (ip) => {
    const attempts = failedAttempts.get(ip);
    if (!attempts) return false;

    if (attempts.count >= MAX_FAILED_ATTEMPTS && 
        Date.now() - attempts.lastAttempt < LOCKOUT_DURATION) {
        return true;
    }

    if (Date.now() - attempts.lastAttempt >= LOCKOUT_DURATION) {
        failedAttempts.delete(ip);
    }

    return false;
};

const recordFailedAttempt = (ip) => {
    const attempts = failedAttempts.get(ip) || { count: 0, lastAttempt: 0 };
    attempts.count += 1;
    attempts.lastAttempt = Date.now();
    failedAttempts.set(ip, attempts);
};

// Check if a role has permission for a specific action on a resource
const hasPermission = (role, resource, action) => {
    logger.debug(`Checking permission for role: ${role}, resource: ${resource}, action: ${action}`);
    
    // Admin has all permissions
    if (role === 'admin') {
        return true;
    }

    // Check direct permissions
    if (rolePermissions[role]?.[resource]?.includes(action)) {
        return true;
    }

    // Check inherited permissions through role hierarchy
    return roleHierarchy[role]?.some(inheritedRole => 
        rolePermissions[inheritedRole]?.[resource]?.includes(action)
    ) || false;
};

// Middleware to check permissions
export const checkPermission = (resource, action) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        
        if (!userRole) {
            logger.error('No user role found in request');
            return res.status(403).json({
                success: false,
                message: 'Authentication required'
            });
        }

        logger.debug(`Checking permission for user role: ${userRole}, resource: ${resource}, action: ${action}`);

        if (!hasPermission(userRole, resource, action)) {
            logger.warn(`Permission denied for user role: ${userRole}, resource: ${resource}, action: ${action}`);
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        next();
    };
};

// Middleware to check ownership or role-based access
export const checkOwnershipOrPermission = (resource, action) => {
    return async (req, res, next) => {
        const userRole = req.user.role;
        const userId = req.user.id;
        const resourceId = req.params.id;

        // If user has admin permissions, allow access
        if (hasPermission('admin', resource, action)) {
            return next();
        }

        try {
            // Get the resource from database
            const [rows] = await req.app.locals.pool.query(
                `SELECT * FROM ${resource} WHERE id = ?`,
                [resourceId]
            );

            const item = rows[0];
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Resource not found'
                });
            }

            // Check if user owns the resource or has required permission
            if (
                (item.created_by === userId || item.assigned_to === userId) ||
                hasPermission(userRole, resource, action)
            ) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        } catch (error) {
            logger.error('Error checking resource ownership:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };
};

// Middleware to log audit trail
export const auditLog = (action) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        res.json = async function(data) {
            res.json = originalJson;
            
            if (data.success !== false) {
                try {
                    const entityType = req.baseUrl.replace('/api/', '').split('/')[0];
                    const entityId = req.params.id || (data.data && data.data.id);
                    
                    if (entityId) {
                        // Get the old values if this is an update
                        let oldValues = null;
                        if (action === 'update' || action === 'delete') {
                            const [rows] = await req.app.locals.pool.query(
                                `SELECT * FROM ${entityType} WHERE id = ?`,
                                [entityId]
                            );
                            oldValues = rows[0];
                        }

                        await req.app.locals.pool.query(
                            `INSERT INTO audit_logs (
                                user_id,
                                action_type,
                                entity_type,
                                entity_id,
                                old_values,
                                new_values,
                                ip_address,
                                user_agent
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                req.user.id,
                                action,
                                entityType,
                                entityId,
                                oldValues ? JSON.stringify(oldValues) : null,
                                JSON.stringify(data.data),
                                req.ip,
                                req.get('user-agent')
                            ]
                        );
                    }
                } catch (error) {
                    logger.error('Error creating audit log:', error);
                }
            }
            
            return res.json(data);
        };
        
        next();
    };
};
