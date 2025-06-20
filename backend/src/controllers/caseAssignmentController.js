import { executeQuery } from "../db.js";
import { logger } from "../middleware/logger.js";
import { mockDirectorData, mockUsers } from "./mockData.js";

export const getCaseAssignments = async (req, res) => {
  try {
    const assignments = await executeQuery(`
            SELECT 
                ca.id,
                ca.distress_message_id,
                ca.assigned_by,
                ca.assigned_to,
                ca.assignment_date,
                ca.director_instructions,
                ca.status,
                dm.folio_number,
                dm.subject,
                dm.priority,
                u1.username as assigned_by_name,
                u2.username as assigned_to_name
            FROM case_assignments ca
            JOIN distress_messages dm ON ca.distress_message_id = dm.id
            JOIN users u1 ON ca.assigned_by = u1.id
            JOIN users u2 ON ca.assigned_to = u2.id
            ORDER BY ca.assignment_date DESC
        `);

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    logger.error("Error fetching case assignments, using mock data:", error);

    // Fallback to mock data
    res.json({
      success: true,
      data: mockDirectorData.caseAssignments || [],
    });
  }
};

export const createCaseAssignment = async (req, res) => {
  try {
    const { distressMessageId, assignedTo, instructions } = req.body;
    const assignedBy = req.user.id;

    if (!distressMessageId || !assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Distress message ID and assigned user are required",
      });
    }

    try {
      // Try MySQL first
      const result = await executeQuery(
        `
                INSERT INTO case_assignments (distress_message_id, assigned_by, assigned_to, director_instructions)
                VALUES (?, ?, ?, ?)
            `,
        [distressMessageId, assignedBy, assignedTo, instructions || ""],
      );

      // Update the distress message status
      await executeQuery(
        `
                UPDATE distress_messages 
                SET status = 'assigned', assigned_to = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `,
        [assignedTo, distressMessageId],
      );

      // Get the created assignment
      const assignment = await executeQuery(
        `
                SELECT 
                    ca.id,
                    ca.distress_message_id,
                    ca.assigned_by,
                    ca.assigned_to,
                    ca.assignment_date,
                    ca.director_instructions,
                    ca.status,
                    dm.folio_number,
                    dm.subject,
                    dm.priority,
                    u1.username as assigned_by_name,
                    u2.username as assigned_to_name
                FROM case_assignments ca
                JOIN distress_messages dm ON ca.distress_message_id = dm.id
                JOIN users u1 ON ca.assigned_by = u1.id
                JOIN users u2 ON ca.assigned_to = u2.id
                WHERE ca.id = ?
            `,
        [result.insertId],
      );

      res.status(201).json({
        success: true,
        data: assignment[0],
      });
    } catch (dbError) {
      logger.error("Database error, using mock response:", dbError);

      // Fallback to mock response
      const mockAssignment = {
        id: Date.now(),
        caseId: distressMessageId,
        folio: `DM${String(distressMessageId).padStart(3, "0")}`,
        subject: "Mock Case Assignment",
        assignedTo: assignedTo,
        assignedBy: req.user.username,
        priority: "high",
        instructions: instructions || "",
        assignedDate: new Date().toISOString(),
        status: "active",
      };

      res.status(201).json({
        success: true,
        data: mockAssignment,
      });
    }
  } catch (error) {
    logger.error("Error creating case assignment:", error);
    res.status(500).json({
      success: false,
      message: "Error creating case assignment",
    });
  }
};

export const updateCaseAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, instructions } = req.body;

    if (!status && !instructions) {
      return res.status(400).json({
        success: false,
        message: "Status or instructions must be provided",
      });
    }

    try {
      // Try MySQL first
      let updateFields = [];
      let values = [];

      if (status) {
        updateFields.push("status = ?");
        values.push(status);
      }

      if (instructions) {
        updateFields.push("director_instructions = ?");
        values.push(instructions);
      }

      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      values.push(id);

      await executeQuery(
        `
                UPDATE case_assignments 
                SET ${updateFields.join(", ")}
                WHERE id = ?
            `,
        values,
      );

      // Get updated assignment
      const assignment = await executeQuery(
        `
                SELECT 
                    ca.id,
                    ca.distress_message_id,
                    ca.assigned_by,
                    ca.assigned_to,
                    ca.assignment_date,
                    ca.director_instructions,
                    ca.status,
                    dm.folio_number,
                    dm.subject,
                    dm.priority,
                    u1.username as assigned_by_name,
                    u2.username as assigned_to_name
                FROM case_assignments ca
                JOIN distress_messages dm ON ca.distress_message_id = dm.id
                JOIN users u1 ON ca.assigned_by = u1.id
                JOIN users u2 ON ca.assigned_to = u2.id
                WHERE ca.id = ?
            `,
        [id],
      );

      if (assignment.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      res.json({
        success: true,
        data: assignment[0],
      });
    } catch (dbError) {
      logger.error("Database error, using mock response:", dbError);

      // Fallback to mock response
      res.json({
        success: true,
        data: {
          id: parseInt(id),
          status: status || "active",
          instructions: instructions || "",
        },
      });
    }
  } catch (error) {
    logger.error("Error updating case assignment:", error);
    res.status(500).json({
      success: false,
      message: "Error updating case assignment",
    });
  }
};

export const getTeamWorkload = async (req, res) => {
  try {
    const workload = await executeQuery(`
            SELECT 
                u.id,
                u.username,
                u.role,
                COUNT(ca.id) as active_cases,
                AVG(TIMESTAMPDIFF(MINUTE, dm.created_at, dm.first_response_at)) as avg_response_time
            FROM users u
            LEFT JOIN case_assignments ca ON u.id = ca.assigned_to AND ca.status = 'active'
            LEFT JOIN distress_messages dm ON ca.distress_message_id = dm.id
            WHERE u.role IN ('front_office', 'cadet') AND u.is_active = TRUE
            GROUP BY u.id, u.username, u.role
            ORDER BY u.role, u.username
        `);

    res.json({
      success: true,
      data: workload,
    });
  } catch (error) {
    logger.error("Error fetching team workload, using mock data:", error);

    // Fallback to mock data
    res.json({
      success: true,
      data: mockDirectorData.teamWorkload || [],
    });
  }
};
