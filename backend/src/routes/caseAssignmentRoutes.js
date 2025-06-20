import express from "express";
import {
  getAllCaseAssignments,
  getCaseAssignmentsByDirector,
  getCaseAssignmentsByAssignee,
  createCaseAssignment,
  updateCaseAssignment,
  reassignCase,
  getTeamWorkload,
  getAssignmentStatistics,
  deleteCaseAssignment,
} from "../controllers/caseAssignmentController.js";
import { authenticateToken } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Get all case assignments (admin)
router.get("/", authenticateToken, asyncHandler(getAllCaseAssignments));

// Get case assignments by director
router.get(
  "/my-assignments",
  authenticateToken,
  asyncHandler(getCaseAssignmentsByDirector),
);

// Get case assignments by assignee
router.get(
  "/assigned-to-me",
  authenticateToken,
  asyncHandler(getCaseAssignmentsByAssignee),
);

// Create new case assignment (directors and admins)
router.post("/", authenticateToken, asyncHandler(createCaseAssignment));

// Update case assignment
router.put("/:id", authenticateToken, asyncHandler(updateCaseAssignment));

// Reassign case
router.post("/:id/reassign", authenticateToken, asyncHandler(reassignCase));

// Get team workload distribution
router.get("/team-workload", authenticateToken, asyncHandler(getTeamWorkload));

// Get assignment statistics
router.get(
  "/statistics",
  authenticateToken,
  asyncHandler(getAssignmentStatistics),
);

// Delete case assignment (admin only)
router.delete("/:id", authenticateToken, asyncHandler(deleteCaseAssignment));

export default router;

export { router as caseAssignmentRoutes };
