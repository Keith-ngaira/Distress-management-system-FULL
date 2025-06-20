import express from "express";
import {
  loginUser,
  changePassword,
  refreshToken,
  logoutUser,
  verifyToken,
  getUserProfile,
} from "../controllers/authController.js";
import { authenticateToken, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Auth routes
router.post("/login", asyncHandler(loginUser));
router.post("/refresh", asyncHandler(refreshToken));
router.post(
  "/change-password",
  authenticateToken,
  asyncHandler(changePassword),
);
router.post("/logout", authenticateToken, asyncHandler(logoutUser));
router.get("/verify", authenticateToken, asyncHandler(verifyToken));
router.get("/profile", authenticateToken, asyncHandler(getUserProfile));

// Test database connection (development only)
if (process.env.NODE_ENV === "development") {
  router.get("/test-db", async (req, res, next) => {
    try {
      const [result] = await req.app.locals.pool.query("SELECT 1");
      res.json({
        success: true,
        message: "Database connection successful",
        result,
      });
    } catch (error) {
      console.error("Database connection error:", error);
      res.status(500).json({
        success: false,
        message: "Database connection failed",
        error: error.message,
      });
    }
  });
}

export default router;
