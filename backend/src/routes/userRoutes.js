import express from "express";
import {
  getCurrentUser,
  getUserById,
  getAllUsers,
  getUsersByRole,
  getUserStatistics,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Get current user (any authenticated user can access their own data)
router.get("/me", authenticateToken, asyncHandler(getCurrentUser));

// Get user statistics (admin only)
router.get("/statistics", authenticateToken, asyncHandler(getUserStatistics));

// Get all users (admin only)
router.get("/", authenticateToken, asyncHandler(getAllUsers));

// Get users by role
router.get("/role/:role", authenticateToken, asyncHandler(getUsersByRole));

// Get user by ID
router.get("/:id", authenticateToken, asyncHandler(getUserById));

// Create new user (admin only)
router.post("/", authenticateToken, asyncHandler(createUser));

// Update user
router.put("/:id", authenticateToken, asyncHandler(updateUser));

// Delete user (admin only)
router.delete("/:id", authenticateToken, asyncHandler(deleteUser));

export default router;

export { router as userRoutes };
