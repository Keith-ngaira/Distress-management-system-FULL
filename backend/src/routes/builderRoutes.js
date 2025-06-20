import express from "express";
import {
  testBuilderConnection,
  syncDistressMessage,
  updateDistressMessage,
  bulkSyncDistressMessages,
  syncUser,
  syncCaseUpdate,
  getModelSchemas,
  getSyncStatus,
} from "../controllers/builderController.js";
import { authenticateToken, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// All Builder.io routes require authentication
router.use(authenticateToken);

// Test Builder.io connection (admin only)
router.get("/test-connection", authorize(["admin"]), testBuilderConnection);

// Get sync status and configuration (admin/director)
router.get("/status", authorize(["admin", "director"]), getSyncStatus);

// Get model schemas for setup (admin only)
router.get("/schemas", authorize(["admin"]), getModelSchemas);

// Sync single distress message (admin/director/front_office)
router.post(
  "/sync/distress-message/:messageId",
  authorize(["admin", "director", "front_office"]),
  syncDistressMessage,
);

// Update distress message in Builder.io (admin/director/front_office)
router.patch(
  "/sync/distress-message/:builderId",
  authorize(["admin", "director", "front_office"]),
  updateDistressMessage,
);

// Bulk sync all distress messages (admin only)
router.post(
  "/sync/bulk/distress-messages",
  authorize(["admin"]),
  bulkSyncDistressMessages,
);

// Sync user (admin only)
router.post("/sync/user", authorize(["admin"]), syncUser);

// Sync case update (admin/director/front_office/cadet)
router.post(
  "/sync/case-update",
  authorize(["admin", "director", "front_office", "cadet"]),
  syncCaseUpdate,
);

export default router;
