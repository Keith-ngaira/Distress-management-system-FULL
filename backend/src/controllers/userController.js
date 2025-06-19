import { executeQuery } from "../db.js";
import bcrypt from "bcrypt";
import {
  mockUsers,
  findUserById,
  findUserByUsername,
  findUserByEmail,
  createMockUser,
  updateMockUser,
  deleteMockUser,
} from "./mockData.js";

export const getCurrentUser = async (req, res) => {
  try {
    const result = await executeQuery(
      "SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?",
      [req.user.id],
    );

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({
      success: false,
      message: "Error getting current user",
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, role, is_active } = req.body;
    const userId = id || req.user.id;

    const updates = {};

    if (email) updates.email = email;
    if (password) updates.password = await bcrypt.hash(password, 10);
    if (role && req.user.role === "admin") updates.role = role;
    if (is_active !== undefined && req.user.role === "admin")
      updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    try {
      // Try MySQL first
      let updateFields = [];
      let values = [];

      Object.entries(updates).forEach(([key, value]) => {
        updateFields.push(`${key} = ?`);
        values.push(value);
      });

      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      values.push(userId);

      await executeQuery(
        `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
        values,
      );

      const result = await executeQuery(
        "SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = ?",
        [userId],
      );

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        data: result[0],
      });
    } catch (dbError) {
      console.error("Database error, using mock data:", dbError);

      // Fallback to mock data
      const updatedUser = updateMockUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({
        success: true,
        data: userWithoutPassword,
      });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const result = await executeQuery(
      "SELECT id, username, email, role, is_active, last_login, created_at, updated_at FROM users ORDER BY created_at DESC",
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting all users, using mock data:", error);
    // Fallback to mock data when MySQL is unavailable
    res.json({
      success: true,
      data: mockUsers.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      ),
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    try {
      // Try MySQL first
      const existingUser = await executeQuery(
        "SELECT id FROM users WHERE username = ? OR email = ?",
        [username, email],
      );

      if (existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Username or email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await executeQuery(
        "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
        [username, email, hashedPassword, role],
      );

      const newUser = await executeQuery(
        "SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = ?",
        [result.insertId],
      );

      res.status(201).json({
        success: true,
        data: newUser[0],
      });
    } catch (dbError) {
      console.error("Database error, using mock data:", dbError);

      // Fallback to mock data
      if (findUserByUsername(username) || findUserByEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "Username or email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = createMockUser({
        username,
        email,
        password: hashedPassword,
        role,
        is_active: true,
      });

      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json({
        success: true,
        data: userWithoutPassword,
      });
    }
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    try {
      // Try MySQL first
      const existingUser = await executeQuery(
        "SELECT id, username FROM users WHERE id = ?",
        [id],
      );

      if (existingUser.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      await executeQuery("DELETE FROM users WHERE id = ?", [id]);

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (dbError) {
      console.error("Database error, using mock data:", dbError);

      // Fallback to mock data
      const deleted = deleteMockUser(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
    });
  }
};
