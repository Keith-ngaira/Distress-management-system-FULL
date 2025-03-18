import db, { executeQuery } from '../db.js';
import bcrypt from 'bcrypt';

export const getCurrentUser = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const result = await client.query(
                'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1',
                [req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting current user'
        });
    }
};

export const updateUser = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const { id } = req.params;
            const { email, password } = req.body;
            const userId = id || req.user.id;

            let updateFields = [];
            let values = [];
            let paramCount = 1;

            if (email) {
                updateFields.push(`email = $${paramCount}`);
                values.push(email);
                paramCount++;
            }

            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updateFields.push(`password = $${paramCount}`);
                values.push(hashedPassword);
                paramCount++;
            }

            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update'
                });
            }

            values.push(userId);
            const result = await client.query(
                `UPDATE users 
                SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                WHERE id = $${paramCount}
                RETURNING id, username, email, role, created_at, updated_at`,
                values
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user'
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const result = await client.query(
                'SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY created_at DESC'
            );

            res.json({
                success: true,
                data: result.rows
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error getting all users:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting all users'
        });
    }
};

export const createUser = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const { username, email, password, role } = req.body;

            // Check if username already exists
            const existingUser = await client.query(
                'SELECT id FROM users WHERE username = $1',
                [username]
            );

            if (existingUser.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await client.query(
                `INSERT INTO users (username, email, password, role)
                VALUES ($1, $2, $3, $4)
                RETURNING id, username, email, role, created_at, updated_at`,
                [username, email, hashedPassword, role]
            );

            res.status(201).json({
                success: true,
                data: result.rows[0]
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user'
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const client = await db.connect();
        try {
            const { id } = req.params;

            // Check if user exists
            const existingUser = await client.query(
                'SELECT id FROM users WHERE id = $1',
                [id]
            );

            if (existingUser.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Delete user
            await client.query('DELETE FROM users WHERE id = $1', [id]);

            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user'
        });
    }
};
