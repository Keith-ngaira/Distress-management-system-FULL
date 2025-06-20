import { executeQuery, executeTransaction, isConnected } from "../db.js";
import { logger } from "../middleware/logger.js";
import bcrypt from "bcryptjs";
import {
  mockUsers,
  findUserById,
  findUserByUsername,
  findUserByEmail,
  createMockUser,
  updateMockUser,
  deleteMockUser,
} from "./mockData.js";

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    // Check if database is connected
    if (!isConnected()) {
      logger.warn("Database not connected, using mock data for getAllUsers");
      return res.json({
        success: true,
        data: mockUsers,
        fallback: true,
      });
    }

    const users = await executeQuery(`
            SELECT
                id,
                username,
                email,
                role,
                is_active,
                last_login,
                created_at,
                updated_at
            FROM users
            ORDER BY created_at DESC
        `);

    logger.info(`Retrieved ${users.length} users from database`);

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    logger.error("Error fetching users from database:", error);

    // Fallback to mock data
    logger.warn("Falling back to mock data due to database error");
    res.json({
      success: true,
      data: mockUsers,
      fallback: true,
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isConnected()) {
      logger.warn("Database not connected, using mock data for getUserById");
      const user = findUserById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      return res.json({
        success: true,
        data: user,
        fallback: true,
      });
    }

    const users = await executeQuery(
      `
            SELECT
                id,
                username,
                email,
                role,
                is_active,
                last_login,
                created_at,
                updated_at
            FROM users
            WHERE id = ?
        `,
      [id],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    logger.info(`Retrieved user ${id} from database`);

    res.json({
      success: true,
      data: users[0],
    });
  } catch (error) {
    logger.error("Error fetching user by ID from database:", error);

    // Fallback to mock data
    const user = findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
      fallback: true,
    });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!isConnected()) {
      logger.warn("Database not connected, using mock data for getCurrentUser");
      const user = findUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      return res.json({
        success: true,
        data: userWithoutPassword,
        fallback: true,
      });
    }

    const users = await executeQuery(
      `
            SELECT
                id,
                username,
                email,
                role,
                is_active,
                last_login,
                created_at,
                updated_at
            FROM users
            WHERE id = ?
        `,
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    logger.info(`Retrieved current user ${userId} from database`);

    res.json({
      success: true,
      data: users[0],
    });
  } catch (error) {
    logger.error("Error fetching current user from database:", error);

    // Fallback to mock data
    const user = findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({
      success: true,
      data: userWithoutPassword,
      fallback: true,
    });
  }
};

// Create new user
export const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Username, email, password, and role are required",
      });
    }

    // Validate role
    const validRoles = ["admin", "director", "front_office", "cadet"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be one of: " + validRoles.join(", "),
      });
    }

    if (!isConnected()) {
      logger.warn("Database not connected, using mock data for createUser");

      // Check if user already exists in mock data
      if (findUserByUsername(username) || findUserByEmail(email)) {
        return res.status(409).json({
          success: false,
          message: "User with this username or email already exists",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = createMockUser({
        username,
        email,
        password: hashedPassword,
        role,
        is_active: true,
      });

      const { password: _, ...userWithoutPassword } = newUser;

      return res.status(201).json({
        success: true,
        data: userWithoutPassword,
        fallback: true,
      });
    }

    // Check if user already exists
    const existingUsers = await executeQuery(
      `
            SELECT id FROM users
            WHERE username = ? OR email = ?
        `,
      [username, email],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this username or email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const result = await executeQuery(
      `
            INSERT INTO users (username, email, password, role, is_active)
            VALUES (?, ?, ?, ?, 1)
        `,
      [username, email, hashedPassword, role],
    );

    // Get the created user
    const newUsers = await executeQuery(
      `
            SELECT
                id,
                username,
                email,
                role,
                is_active,
                last_login,
                created_at,
                updated_at
            FROM users
            WHERE id = ?
        `,
      [result.insertId],
    );

    logger.info(`Created new user: ${username} with role: ${role}`);

    res.status(201).json({
      success: true,
      data: newUsers[0],
      message: "User created successfully",
    });
  } catch (error) {
    logger.error("Error creating user in database:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "User with this username or email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, is_active, password } = req.body;

    if (!isConnected()) {
      logger.warn("Database not connected, using mock data for updateUser");

      const updateData = { username, email, role, is_active };
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = updateMockUser(id, updateData);
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;

      return res.json({
        success: true,
        data: userWithoutPassword,
        fallback: true,
      });
    }

    // Check if user exists
    const existingUsers = await executeQuery(
      `
            SELECT id FROM users WHERE id = ?
        `,
      [id],
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (username !== undefined) {
      updateFields.push("username = ?");
      updateValues.push(username);
    }
    if (email !== undefined) {
      updateFields.push("email = ?");
      updateValues.push(email);
    }
    if (role !== undefined) {
      // Validate role
      const validRoles = ["admin", "director", "front_office", "cadet"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Must be one of: " + validRoles.join(", "),
        });
      }
      updateFields.push("role = ?");
      updateValues.push(role);
    }
    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      updateValues.push(is_active);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push("password = ?");
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updateFields.push("updated_at = NOW()");
    updateValues.push(id);

    // Update user
    await executeQuery(
      `
            UPDATE users
            SET ${updateFields.join(", ")}
            WHERE id = ?
        `,
      updateValues,
    );

    // Get updated user
    const updatedUsers = await executeQuery(
      `
            SELECT
                id,
                username,
                email,
                role,
                is_active,
                last_login,
                created_at,
                updated_at
            FROM users
            WHERE id = ?
        `,
      [id],
    );

    logger.info(`Updated user ${id} in database`);

    res.json({
      success: true,
      data: updatedUsers[0],
      message: "User updated successfully",
    });
  } catch (error) {
    logger.error("Error updating user in database:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent users from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    if (!isConnected()) {
      logger.warn("Database not connected, using mock data for deleteUser");

      const deleted = deleteMockUser(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.json({
        success: true,
        message: "User deleted successfully",
        fallback: true,
      });
    }

    // Check if user exists
    const existingUsers = await executeQuery(
      `
            SELECT id, username FROM users WHERE id = ?
        `,
      [id],
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Use transaction to handle related data
    await executeTransaction([
      // Update assigned cases to unassigned
      {
        sql: "UPDATE distress_messages SET assigned_to = NULL WHERE assigned_to = ?",
        params: [id],
      },
      // Update case assignments
      {
        sql: 'UPDATE case_assignments SET status = "completed" WHERE assigned_to = ?',
        params: [id],
      },
      // Delete user notifications
      {
        sql: "DELETE FROM notifications WHERE user_id = ?",
        params: [id],
      },
      // Finally delete the user
      {
        sql: "DELETE FROM users WHERE id = ?",
        params: [id],
      },
    ]);

    logger.info(
      `Deleted user ${id} (${existingUsers[0].username}) from database`,
    );

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting user from database:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

// Get users by role
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    // Validate role
    const validRoles = ["admin", "director", "front_office", "cadet"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be one of: " + validRoles.join(", "),
      });
    }

    if (!isConnected()) {
      logger.warn("Database not connected, using mock data for getUsersByRole");
      const users = mockUsers.filter((user) => user.role === role);
      return res.json({
        success: true,
        data: users,
        fallback: true,
      });
    }

    const users = await executeQuery(
      `
            SELECT
                id,
                username,
                email,
                role,
                is_active,
                last_login,
                created_at,
                updated_at
            FROM users
            WHERE role = ?
            ORDER BY created_at DESC
        `,
      [role],
    );

    logger.info(
      `Retrieved ${users.length} users with role ${role} from database`,
    );

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    logger.error("Error fetching users by role from database:", error);

    // Fallback to mock data
    const users = mockUsers.filter((user) => user.role === req.params.role);
    res.json({
      success: true,
      data: users,
      fallback: true,
    });
  }
};

// Update user last login
export const updateLastLogin = async (userId) => {
  try {
    if (!isConnected()) {
      logger.warn("Database not connected, skipping last login update");
      return;
    }

    await executeQuery(
      `
            UPDATE users
            SET last_login = NOW()
            WHERE id = ?
        `,
      [userId],
    );

    logger.info(`Updated last login for user ${userId}`);
  } catch (error) {
    logger.error("Error updating last login:", error);
    // Don't throw error for this non-critical operation
  }
};

// Get user statistics
export const getUserStatistics = async (req, res) => {
  try {
    if (!isConnected()) {
      logger.warn(
        "Database not connected, using mock data for getUserStatistics",
      );
      const stats = {
        total: mockUsers.length,
        active: mockUsers.filter((u) => u.is_active).length,
        byRole: mockUsers.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {}),
        recentRegistrations: mockUsers.filter(
          (u) =>
            new Date(u.created_at) >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        ).length,
      };

      return res.json({
        success: true,
        data: stats,
        fallback: true,
      });
    }

    const totalUsers = await executeQuery(`
            SELECT COUNT(*) as total FROM users
        `);

    const activeUsers = await executeQuery(`
            SELECT COUNT(*) as active FROM users WHERE is_active = 1
        `);

    const usersByRole = await executeQuery(`
            SELECT role, COUNT(*) as count
            FROM users
            GROUP BY role
        `);

    const recentRegistrations = await executeQuery(`
            SELECT COUNT(*) as recent
            FROM users
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `);

    const stats = {
      total: parseInt(totalUsers[0].total),
      active: parseInt(activeUsers[0].active),
      byRole: usersByRole.reduce((acc, row) => {
        acc[row.role] = parseInt(row.count);
        return acc;
      }, {}),
      recentRegistrations: parseInt(recentRegistrations[0].recent),
    };

    logger.info("Retrieved user statistics from database");

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error fetching user statistics from database:", error);

    // Fallback to mock data calculation
    const stats = {
      total: mockUsers.length,
      active: mockUsers.filter((u) => u.is_active).length,
      byRole: mockUsers.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {}),
      recentRegistrations: mockUsers.filter(
        (u) =>
          new Date(u.created_at) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      ).length,
    };

    res.json({
      success: true,
      data: stats,
      fallback: true,
    });
  }
};
