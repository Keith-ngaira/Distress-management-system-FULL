import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../db.js';
import { revokeToken } from '../middleware/auth.js';

// Maximum failed login attempts before temporary lockout
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15; // minutes

// In-memory store for failed login attempts (should be moved to Redis in production)
const failedLoginAttempts = new Map();

const incrementLoginAttempts = (username) => {
    const now = Date.now();
    const attempts = failedLoginAttempts.get(username) || { count: 0, firstAttempt: now };
    
    // Reset if lockout duration has passed
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        const timeSinceFirstAttempt = (now - attempts.firstAttempt) / (1000 * 60); // convert to minutes
        if (timeSinceFirstAttempt >= LOCKOUT_DURATION) {
            attempts.count = 1;
            attempts.firstAttempt = now;
        }
    } else {
        attempts.count += 1;
    }
    
    failedLoginAttempts.set(username, attempts);
    return attempts;
};

const resetLoginAttempts = (username) => {
    failedLoginAttempts.delete(username);
};

const isAccountLocked = (username) => {
    const attempts = failedLoginAttempts.get(username);
    if (!attempts) return false;

    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        const timeSinceFirstAttempt = (Date.now() - attempts.firstAttempt) / (1000 * 60);
        return timeSinceFirstAttempt < LOCKOUT_DURATION;
    }
    return false;
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Check if account is locked
        if (isAccountLocked(username)) {
            return res.status(429).json({
                success: false,
                message: `Account locked. Please try again after ${LOCKOUT_DURATION} minutes.`
            });
        }

        const users = await executeQuery(
            'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
            [username]
        );

        if (users.length === 0) {
            incrementLoginAttempts(username);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            const attempts = incrementLoginAttempts(username);
            const remainingAttempts = MAX_LOGIN_ATTEMPTS - attempts.count;
            
            return res.status(401).json({
                success: false,
                message: remainingAttempts > 0 
                    ? `Invalid credentials. ${remainingAttempts} attempts remaining.`
                    : `Account locked. Please try again after ${LOCKOUT_DURATION} minutes.`
            });
        }

        // Reset login attempts on successful login
        resetLoginAttempts(username);

        // Create token with required fields for jwt-decode
        const token = jwt.sign(
            { 
                sub: user.id.toString(),
                id: user.id,
                username: user.username,
                role: user.role,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
            },
            process.env.JWT_SECRET
        );

        // Update last login
        await executeQuery(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userWithoutPassword,
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'No token provided'
            });
        }

        const success = await revokeToken(token);

        if (!success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to revoke token'
            });
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const register = async (req, res) => {
    try {
        const { username, password, email, role } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, and email are required'
            });
        }

        // Check if any users exist
        const [existingUsers] = await executeQuery('SELECT COUNT(*) as count FROM users');
        const isFirstUser = existingUsers[0].count === 0;

        // If this is not the first user, only admin can register new users
        if (!isFirstUser && (!req.user || req.user.role !== 'admin')) {
            return res.status(403).json({
                success: false,
                message: 'Only admin can register new users'
            });
        }

        // If this is not the first user and the role is admin, only existing admin can create new admins
        if (!isFirstUser && role === 'admin' && (!req.user || req.user.role !== 'admin')) {
            return res.status(403).json({
                success: false,
                message: 'Only existing admin can create new admin users'
            });
        }

        // Check if user already exists
        const [existingUser] = await executeQuery(
            'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser.length) {
            const field = existingUser[0].username === username ? 'username' : 'email';
            return res.status(400).json({
                success: false,
                message: `User with this ${field} already exists`
            });
        }

        // For the first user, force role to be admin
        const userRole = isFirstUser ? 'admin' : role;

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        const [result] = await executeQuery(
            `INSERT INTO users (
                username,
                password,
                email,
                role,
                is_active,
                created_at
            ) VALUES (?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP)`,
            [username, hashedPassword, email, userRole]
        );

        // Get the created user
        const [newUser] = await executeQuery(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: isFirstUser ? 'First admin user registered successfully' : 'User registered successfully',
            data: {
                user: newUser[0]
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        const userId = req.user.id;

        // Get user's current password
        const [users] = await executeQuery(
            'SELECT password FROM users WHERE id = ? AND is_active = TRUE',
            [userId]
        );

        if (!users.length) {
            return res.status(404).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        const validPassword = await bcrypt.compare(currentPassword, users[0].password);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Prevent reuse of current password
        const isSamePassword = await bcrypt.compare(newPassword, users[0].password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and revoke all existing tokens
        await executeQuery(
            'UPDATE users SET password = ?, password_changed_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, userId]
        );

        // Revoke current token to force re-login with new password
        if (req.token) {
            revokeToken(req.token);
        }

        res.json({
            success: true,
            message: 'Password changed successfully. Please log in with your new password.'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
