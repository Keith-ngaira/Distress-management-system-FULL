import { Router } from "express";
import {
  getAllDistressMessages,
  getDistressMessageById,
  createDistressMessage,
  updateDistressMessage,
  addCaseUpdate,
  assignDistressMessage,
  getDistressMessageStatistics,
  deleteDistressMessage,
} from "../controllers/distressMessageController.js";
import { authenticateToken } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// Get messages with pagination and filtering
router.get("/", authenticateToken, asyncHandler(getAllDistressMessages));

// Get dashboard statistics
router.get(
  "/statistics",
  authenticateToken,
  asyncHandler(getDistressMessageStatistics),
);

// Create a new message
router.post("/", authenticateToken, asyncHandler(createDistressMessage));

// Get a specific message
router.get("/:id", authenticateToken, asyncHandler(getDistressMessageById));

// Update a message
router.put("/:id", authenticateToken, asyncHandler(updateDistressMessage));

// Add case update
router.post("/:id/updates", authenticateToken, asyncHandler(addCaseUpdate));

// Assign a message
router.post(
  "/:id/assign",
  authenticateToken,
  asyncHandler(assignDistressMessage),
);

// Delete a message (admin only)
router.delete("/:id", authenticateToken, asyncHandler(deleteDistressMessage));

export default router;
