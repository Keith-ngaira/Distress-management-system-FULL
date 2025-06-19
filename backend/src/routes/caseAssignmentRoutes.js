import express from "express";
import {
  getCaseAssignments,
  createCaseAssignment,
  updateCaseAssignment,
  getTeamWorkload,
} from "../controllers/caseAssignmentController.js";
import { authenticateToken, checkPermission } from "../middleware/auth.js";

const router = express.Router();

// Get all case assignments (directors and admins)
router.get(
  "/",
  authenticateToken,
  checkPermission("cases", "assign"),
  getCaseAssignments,
);

// Create new case assignment (directors and admins)
router.post(
  "/",
  authenticateToken,
  checkPermission("cases", "assign"),
  createCaseAssignment,
);

// Update case assignment (directors and admins)
router.put(
  "/:id",
  authenticateToken,
  checkPermission("cases", "assign"),
  updateCaseAssignment,
);

// Get team workload distribution (directors and admins)
router.get(
  "/team-workload",
  authenticateToken,
  checkPermission("cases", "assign"),
  getTeamWorkload,
);

export default router;
