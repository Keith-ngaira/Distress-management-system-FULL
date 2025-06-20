import { executeQuery, executeTransaction, isConnected } from "../db.js";
import { logger } from "../middleware/logger.js";

// Get all case assignments
export const getAllCaseAssignments = async (req, res) => {
  try {
    if (!isConnected()) {
      logger.warn(
        "Database not connected, returning empty array for case assignments",
      );
      return res.json({
        success: true,
        data: [],
        fallback: true,
      });
    }

    const assignments = await executeQuery(`
            SELECT 
                ca.id,
                ca.distress_message_id,
                dm.folio_number,
                dm.subject,
                dm.priority,
                ca.assigned_by,
                ca.assigned_to,
                ca.assignment_date,
                ca.director_instructions,
                ca.status,
                ca.completed_at,
                assignedBy.username as assigned_by_username,
                assignedTo.username as assigned_to_username,
                assignedTo.role as assigned_to_role
            FROM case_assignments ca
            JOIN distress_messages dm ON ca.distress_message_id = dm.id
            LEFT JOIN users assignedBy ON ca.assigned_by = assignedBy.id
            LEFT JOIN users assignedTo ON ca.assigned_to = assignedTo.id
            ORDER BY ca.assignment_date DESC
        `);

    logger.info(
      `Retrieved ${assignments.length} case assignments from database`,
    );

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    logger.error("Error fetching case assignments from database:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch case assignments",
    });
  }
};

// Get case assignments by director
export const getCaseAssignmentsByDirector = async (req, res) => {
  try {
    const directorId = req.user.id;

    if (!isConnected()) {
      logger.warn(
        "Database not connected, returning empty array for director assignments",
      );
      return res.json({
        success: true,
        data: [],
        fallback: true,
      });
    }

    const assignments = await executeQuery(
      `
            SELECT 
                ca.id,
                ca.distress_message_id,
                dm.folio_number,
                dm.subject,
                dm.priority,
                dm.status as case_status,
                ca.assigned_to,
                ca.assignment_date,
                ca.director_instructions,
                ca.status,
                ca.completed_at,
                assignedTo.username as assigned_to_username,
                assignedTo.role as assigned_to_role
            FROM case_assignments ca
            JOIN distress_messages dm ON ca.distress_message_id = dm.id
            LEFT JOIN users assignedTo ON ca.assigned_to = assignedTo.id
            WHERE ca.assigned_by = ?
            ORDER BY ca.assignment_date DESC
        `,
      [directorId],
    );

    logger.info(
      `Retrieved ${assignments.length} case assignments for director ${directorId}`,
    );

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    logger.error(
      "Error fetching director case assignments from database:",
      error,
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch case assignments",
    });
  }
};

// Get case assignments by assignee
export const getCaseAssignmentsByAssignee = async (req, res) => {
  try {
    const assigneeId = req.user.id;

    if (!isConnected()) {
      logger.warn(
        "Database not connected, returning empty array for assignee assignments",
      );
      return res.json({
        success: true,
        data: [],
        fallback: true,
      });
    }

    const assignments = await executeQuery(
      `
            SELECT 
                ca.id,
                ca.distress_message_id,
                dm.folio_number,
                dm.subject,
                dm.priority,
                dm.status as case_status,
                dm.country_of_origin,
                dm.distressed_person_name,
                dm.created_at as case_created_at,
                ca.assigned_by,
                ca.assignment_date,
                ca.director_instructions,
                ca.status,
                ca.completed_at,
                assignedBy.username as assigned_by_username
            FROM case_assignments ca
            JOIN distress_messages dm ON ca.distress_message_id = dm.id
            LEFT JOIN users assignedBy ON ca.assigned_by = assignedBy.id
            WHERE ca.assigned_to = ? AND ca.status = 'active'
            ORDER BY 
                CASE dm.priority 
                    WHEN 'urgent' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    ELSE 4 
                END,
                ca.assignment_date DESC
        `,
      [assigneeId],
    );

    logger.info(
      `Retrieved ${assignments.length} active case assignments for assignee ${assigneeId}`,
    );

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    logger.error(
      "Error fetching assignee case assignments from database:",
      error,
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch case assignments",
    });
  }
};

// Create new case assignment
export const createCaseAssignment = async (req, res) => {
  try {
    const { distressMessageId, assignedTo, instructions } = req.body;
    const assignedBy = req.user.id;

    // Validate required fields
    if (!distressMessageId || !assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Distress message ID and assignee are required",
      });
    }

    if (!isConnected()) {
      logger.warn("Database not connected, cannot create case assignment");
      return res.status(503).json({
        success: false,
        message: "Database service unavailable",
        fallback: true,
      });
    }

    // Check if distress message exists
    const message = await executeQuery(
      `
            SELECT id, folio_number, subject, status 
            FROM distress_messages 
            WHERE id = ?
        `,
      [distressMessageId],
    );

    if (message.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Distress message not found",
      });
    }

    // Check if assignee exists and is active
    const assignee = await executeQuery(
      `
            SELECT id, username, role 
            FROM users 
            WHERE id = ? AND is_active = 1
        `,
      [assignedTo],
    );

    if (assignee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Assignee not found or inactive",
      });
    }

    // Check if message is already assigned
    const existingAssignment = await executeQuery(
      `
            SELECT id FROM case_assignments 
            WHERE distress_message_id = ? AND status = 'active'
        `,
      [distressMessageId],
    );

    if (existingAssignment.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Case is already assigned to someone else",
      });
    }

    // Create assignment and update message status in transaction
    const results = await executeTransaction([
      {
        sql: `INSERT INTO case_assignments 
                      (distress_message_id, assigned_by, assigned_to, director_instructions, assignment_date, status) 
                      VALUES (?, ?, ?, ?, NOW(), 'active')`,
        params: [
          distressMessageId,
          assignedBy,
          assignedTo,
          instructions || null,
        ],
      },
      {
        sql: `UPDATE distress_messages 
                      SET assigned_to = ?, status = 'assigned', updated_at = NOW(),
                          first_response_at = CASE WHEN first_response_at IS NULL THEN NOW() ELSE first_response_at END
                      WHERE id = ?`,
        params: [assignedTo, distressMessageId],
      },
    ]);

    // Get the created assignment
    const newAssignment = await executeQuery(
      `
            SELECT 
                ca.id,
                ca.distress_message_id,
                dm.folio_number,
                dm.subject,
                dm.priority,
                ca.assigned_by,
                ca.assigned_to,
                ca.assignment_date,
                ca.director_instructions,
                ca.status,
                assignedBy.username as assigned_by_username,
                assignedTo.username as assigned_to_username,
                assignedTo.role as assigned_to_role
            FROM case_assignments ca
            JOIN distress_messages dm ON ca.distress_message_id = dm.id
            LEFT JOIN users assignedBy ON ca.assigned_by = assignedBy.id
            LEFT JOIN users assignedTo ON ca.assigned_to = assignedTo.id
            WHERE ca.id = ?
        `,
      [results[0].insertId],
    );

    logger.info(
      `Created case assignment: ${message[0].folio_number} assigned to ${assignee[0].username} by ${req.user.username}`,
    );

    res.status(201).json({
      success: true,
      data: newAssignment[0],
      message: `Case ${message[0].folio_number} assigned to ${assignee[0].username} successfully`,
    });
  } catch (error) {
    logger.error("Error creating case assignment in database:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create case assignment",
    });
  }
};

// Update case assignment status
export const updateCaseAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completionNotes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // Validate status
    const validStatuses = ["active", "completed", "reassigned"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
    }

    if (!isConnected()) {
      logger.warn("Database not connected, cannot update case assignment");
      return res.status(503).json({
        success: false,
        message: "Database service unavailable",
        fallback: true,
      });
    }

    // Check if assignment exists and user has permission
    const assignment = await executeQuery(
      `
            SELECT 
                ca.id,
                ca.distress_message_id,
                ca.assigned_by,
                ca.assigned_to,
                ca.status,
                dm.folio_number
            FROM case_assignments ca
            JOIN distress_messages dm ON ca.distress_message_id = dm.id
            WHERE ca.id = ?
        `,
      [id],
    );

    if (assignment.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Case assignment not found",
      });
    }

    const assignmentData = assignment[0];

    // Check permissions - only director who assigned or the assignee can update
    if (
      req.user.id !== assignmentData.assigned_by &&
      req.user.id !== assignmentData.assigned_to
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this assignment",
      });
    }

    // Build update query
    const updateFields = ["status = ?", "updated_at = NOW()"];
    const updateValues = [status];

    if (status === "completed") {
      updateFields.push("completed_at = NOW()");
      if (completionNotes) {
        updateFields.push("completion_notes = ?");
        updateValues.push(completionNotes);
      }
    }

    updateValues.push(id);

    // Update assignment
    await executeQuery(
      `
            UPDATE case_assignments 
            SET ${updateFields.join(", ")} 
            WHERE id = ?
        `,
      updateValues,
    );

    // Update distress message status if assignment is completed
    if (status === "completed") {
      await executeQuery(
        `
                UPDATE distress_messages 
                SET status = 'resolved', resolved_at = NOW(), updated_at = NOW()
                WHERE id = ?
            `,
        [assignmentData.distress_message_id],
      );
    }

    // Get updated assignment
    const updatedAssignment = await executeQuery(
      `
            SELECT 
                ca.id,
                ca.distress_message_id,
                dm.folio_number,
                dm.subject,
                dm.priority,
                ca.assigned_by,
                ca.assigned_to,
                ca.assignment_date,
                ca.director_instructions,
                ca.status,
                ca.completed_at,
                assignedBy.username as assigned_by_username,
                assignedTo.username as assigned_to_username
            FROM case_assignments ca
            JOIN distress_messages dm ON ca.distress_message_id = dm.id
            LEFT JOIN users assignedBy ON ca.assigned_by = assignedBy.id
            LEFT JOIN users assignedTo ON ca.assigned_to = assignedTo.id
            WHERE ca.id = ?
        `,
      [id],
    );

    logger.info(
      `Updated case assignment ${id} status to ${status} by user ${req.user.username}`,
    );

    res.json({
      success: true,
      data: updatedAssignment[0],
      message: `Case assignment status updated to ${status}`,
    });
  } catch (error) {
    logger.error("Error updating case assignment in database:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update case assignment",
    });
  }
};

// Reassign case
export const reassignCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { newAssigneeId, reason } = req.body;

    if (!newAssigneeId) {
      return res.status(400).json({
        success: false,
        message: "New assignee ID is required",
      });
    }

    if (!isConnected()) {
      logger.warn("Database not connected, cannot reassign case");
      return res.status(503).json({
        success: false,
        message: "Database service unavailable",
        fallback: true,
      });
    }

    // Check if assignment exists
    const assignment = await executeQuery(
      `
            SELECT 
                ca.id,
                ca.distress_message_id,
                ca.assigned_by,
                ca.assigned_to,
                dm.folio_number
            FROM case_assignments ca
            JOIN distress_messages dm ON ca.distress_message_id = dm.id
            WHERE ca.id = ? AND ca.status = 'active'
        `,
      [id],
    );

    if (assignment.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Active case assignment not found",
      });
    }

    // Only the assigning director can reassign
    if (req.user.id !== assignment[0].assigned_by) {
      return res.status(403).json({
        success: false,
        message: "Only the assigning director can reassign this case",
      });
    }

    // Check if new assignee exists
    const newAssignee = await executeQuery(
      `
            SELECT id, username, role 
            FROM users 
            WHERE id = ? AND is_active = 1
        `,
      [newAssigneeId],
    );

    if (newAssignee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "New assignee not found or inactive",
      });
    }

    // Perform reassignment in transaction
    await executeTransaction([
      {
        sql: `UPDATE case_assignments 
                      SET status = 'reassigned', completed_at = NOW() 
                      WHERE id = ?`,
        params: [id],
      },
      {
        sql: `INSERT INTO case_assignments 
                      (distress_message_id, assigned_by, assigned_to, director_instructions, assignment_date, status) 
                      VALUES (?, ?, ?, ?, NOW(), 'active')`,
        params: [
          assignment[0].distress_message_id,
          req.user.id,
          newAssigneeId,
          reason || `Reassigned from previous assignee`,
        ],
      },
      {
        sql: `UPDATE distress_messages 
                      SET assigned_to = ?, updated_at = NOW() 
                      WHERE id = ?`,
        params: [newAssigneeId, assignment[0].distress_message_id],
      },
    ]);

    logger.info(
      `Reassigned case ${assignment[0].folio_number} to ${newAssignee[0].username} by ${req.user.username}`,
    );

    res.json({
      success: true,
      message: `Case ${assignment[0].folio_number} reassigned to ${newAssignee[0].username} successfully`,
    });
  } catch (error) {
    logger.error("Error reassigning case in database:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reassign case",
    });
  }
};

// Get team workload
export const getTeamWorkload = async (req, res) => {
  try {
    if (!isConnected()) {
      logger.warn(
        "Database not connected, returning empty array for team workload",
      );
      return res.json({
        success: true,
        data: [],
        fallback: true,
      });
    }

    const workload = await executeQuery(`
            SELECT 
                u.id,
                u.username,
                u.role,
                COUNT(ca.id) as active_assignments,
                COUNT(dm.id) as total_cases,
                COUNT(CASE WHEN dm.status = 'resolved' THEN 1 END) as completed_cases,
                AVG(CASE WHEN dm.first_response_at IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, dm.created_at, dm.first_response_at)
                    ELSE NULL END) as avg_response_time,
                COUNT(CASE WHEN dm.status = 'resolved' THEN 1 END) * 100.0 / 
                NULLIF(COUNT(dm.id), 0) as completion_rate
            FROM users u
            LEFT JOIN case_assignments ca ON u.id = ca.assigned_to AND ca.status = 'active'
            LEFT JOIN distress_messages dm ON u.id = dm.assigned_to
            WHERE u.role IN ('front_office', 'cadet') AND u.is_active = 1
            GROUP BY u.id, u.username, u.role
            ORDER BY u.role, active_assignments DESC
        `);

    const workloadData = workload.map((member) => ({
      id: member.id,
      username: member.username,
      role: member.role,
      activeAssignments: parseInt(member.active_assignments || 0),
      totalCases: parseInt(member.total_cases || 0),
      completedCases: parseInt(member.completed_cases || 0),
      avgResponseTime: Math.round(member.avg_response_time || 0),
      completionRate: Math.round(member.completion_rate || 0),
      workloadLevel:
        member.active_assignments > 3
          ? "High"
          : member.active_assignments > 1
            ? "Medium"
            : "Low",
    }));

    logger.info(`Retrieved team workload for ${workload.length} team members`);

    res.json({
      success: true,
      data: workloadData,
    });
  } catch (error) {
    logger.error("Error fetching team workload from database:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch team workload",
    });
  }
};

// Get assignment statistics
export const getAssignmentStatistics = async (req, res) => {
  try {
    if (!isConnected()) {
      logger.warn("Database not connected, returning empty statistics");
      return res.json({
        success: true,
        data: {
          totalAssignments: 0,
          activeAssignments: 0,
          completedAssignments: 0,
          reassignedAssignments: 0,
          avgCompletionTime: 0,
        },
        fallback: true,
      });
    }

    const stats = await executeQuery(`
            SELECT 
                COUNT(*) as total_assignments,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_assignments,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_assignments,
                COUNT(CASE WHEN status = 'reassigned' THEN 1 END) as reassigned_assignments,
                AVG(CASE WHEN status = 'completed' AND completed_at IS NOT NULL
                    THEN TIMESTAMPDIFF(HOUR, assignment_date, completed_at)
                    ELSE NULL END) as avg_completion_time
            FROM case_assignments
        `);

    const statistics = {
      totalAssignments: parseInt(stats[0].total_assignments || 0),
      activeAssignments: parseInt(stats[0].active_assignments || 0),
      completedAssignments: parseInt(stats[0].completed_assignments || 0),
      reassignedAssignments: parseInt(stats[0].reassigned_assignments || 0),
      avgCompletionTime: Math.round(stats[0].avg_completion_time || 0),
    };

    logger.info("Retrieved assignment statistics from database");

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    logger.error("Error fetching assignment statistics from database:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch assignment statistics",
    });
  }
};

// Delete case assignment (admin only)
export const deleteCaseAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admins can delete assignments
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can delete case assignments",
      });
    }

    if (!isConnected()) {
      logger.warn("Database not connected, cannot delete case assignment");
      return res.status(503).json({
        success: false,
        message: "Database service unavailable",
        fallback: true,
      });
    }

    // Check if assignment exists
    const assignment = await executeQuery(
      `
            SELECT 
                ca.id,
                ca.distress_message_id,
                dm.folio_number
            FROM case_assignments ca
            JOIN distress_messages dm ON ca.distress_message_id = dm.id
            WHERE ca.id = ?
        `,
      [id],
    );

    if (assignment.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Case assignment not found",
      });
    }

    // Delete assignment and update message status in transaction
    await executeTransaction([
      {
        sql: "DELETE FROM case_assignments WHERE id = ?",
        params: [id],
      },
      {
        sql: `UPDATE distress_messages 
                      SET assigned_to = NULL, status = 'pending', updated_at = NOW() 
                      WHERE id = ?`,
        params: [assignment[0].distress_message_id],
      },
    ]);

    logger.info(
      `Deleted case assignment ${id} for case ${assignment[0].folio_number} by admin ${req.user.username}`,
    );

    res.json({
      success: true,
      message: "Case assignment deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting case assignment from database:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete case assignment",
    });
  }
};
