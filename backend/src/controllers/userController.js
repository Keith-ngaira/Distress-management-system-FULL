import { executeQuery } from "../db.js";
import bcrypt from "bcrypt";

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

    let updateFields = [];
    let values = [];

    if (email) {
      updateFields.push("email = ?");
      values.push(email);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push("password = ?");
      values.push(hashedPassword);
    }

    if (role && req.user.role === "admin") {
      updateFields.push("role = ?");
      values.push(role);
    }

    if (is_active !== undefined && req.user.role === "admin") {
      updateFields.push("is_active = ?");
      values.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(userId);

    await executeQuery(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
      values,
    );

    // Get updated user data
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
    console.error("Error getting all users:", error);
    res.status(500).json({
      success: false,
      message: "Error getting all users",
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

    // Check if username already exists
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

    // Get the created user
    const newUser = await executeQuery(
      "SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = ?",
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      data: newUser[0],
    });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
    }
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

    // Check if user exists
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

    // Delete user
    await executeQuery("DELETE FROM users WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
    });
  }
};
