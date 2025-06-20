import { executeQuery, executeTransaction, isConnected } from "../db.js";
import { logger } from "../middleware/logger.js";

// Get all distress messages
export const getAllDistressMessages = async (req, res) => {
  try {
    const {
      status,
      priority,
      assigned_to,
      country_of_origin,
      date_from,
      date_to,
      search,
      limit = 50,
      offset = 0,
    } = req.query;

    if (!isConnected()) {
      logger.warn(
        "Database not connected, returning empty array for distress messages",
      );
      return res.json({
        success: true,
        data: [],
        total: 0,
        fallback: true,
      });
    }

    // Build WHERE clause dynamically
    const whereConditions = [];
    const queryParams = [];

    if (status) {
      whereConditions.push("dm.status = ?");
      queryParams.push(status);
    }

    if (priority) {
      whereConditions.push("dm.priority = ?");
      queryParams.push(priority);
    }

    if (assigned_to) {
      if (assigned_to === "unassigned") {
        whereConditions.push("dm.assigned_to IS NULL");
      } else {
        whereConditions.push("dm.assigned_to = ?");
        queryParams.push(assigned_to);
      }
    }

    if (country_of_origin) {
      whereConditions.push("dm.country_of_origin = ?");
      queryParams.push(country_of_origin);
    }

    if (date_from) {
      whereConditions.push("dm.created_at >= ?");
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push("dm.created_at <= ?");
      queryParams.push(date_to);
    }

    if (search) {
      whereConditions.push(`(
                dm.folio_number LIKE ? OR 
                dm.subject LIKE ? OR 
                dm.sender_name LIKE ? OR 
                dm.distressed_person_name LIKE ?
            )`);
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Get total count
    const countQuery = `
            SELECT COUNT(*) as total
            FROM distress_messages dm
            ${whereClause}
        `;
    const countResult = await executeQuery(countQuery, queryParams);
    const total = parseInt(countResult[0].total);

    // Get paginated results
    const dataQuery = `
            SELECT 
                dm.id,
                dm.folio_number,
                dm.sender_name,
                dm.reference_number,
                dm.subject,
                dm.country_of_origin,
                dm.distressed_person_name,
                dm.nature_of_case,
                dm.case_details,
                dm.priority,
                dm.status,
                dm.created_by,
                dm.assigned_to,
                dm.created_at,
                dm.updated_at,
                dm.first_response_at,
                dm.resolved_at,
                dm.resolution_notes,
                creator.username as created_by_username,
                assignee.username as assigned_to_username
            FROM distress_messages dm
            LEFT JOIN users creator ON dm.created_by = creator.id
            LEFT JOIN users assignee ON dm.assigned_to = assignee.id
            ${whereClause}
            ORDER BY 
                CASE dm.priority 
                    WHEN 'urgent' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    ELSE 4 
                END,
                dm.created_at DESC
            LIMIT ? OFFSET ?
        `;

    queryParams.push(parseInt(limit), parseInt(offset));
    const messages = await executeQuery(dataQuery, queryParams);

    logger.info(
      `Retrieved ${messages.length} distress messages from database (total: ${total})`,
    );

    res.json({
      success: true,
      data: messages,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    logger.error("Error fetching distress messages from database:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch distress messages",
    });
  }
};

// Get distress message by ID
export const getDistressMessageById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isConnected()) {
      logger.warn(
        "Database not connected, cannot fetch distress message by ID",
      );
      return res.status(404).json({
        success: false,
        message: "Distress message not found",
        fallback: true,
      });
    }

    const messages = await executeQuery(
      `
            SELECT 
                dm.id,
                dm.folio_number,
                dm.sender_name,
                dm.reference_number,
                dm.subject,
                dm.country_of_origin,
                dm.distressed_person_name,
                dm.nature_of_case,
                dm.case_details,
                dm.priority,
                dm.status,
                dm.created_by,
                dm.assigned_to,
                dm.created_at,
                dm.updated_at,
                dm.first_response_at,
                dm.resolved_at,
                dm.resolution_notes,
                creator.username as created_by_username,
                assignee.username as assigned_to_username
            FROM distress_messages dm
            LEFT JOIN users creator ON dm.created_by = creator.id
            LEFT JOIN users assignee ON dm.assigned_to = assignee.id
            WHERE dm.id = ?
        `,
      [id],
    );

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Distress message not found",
      });
    }

    // Get case updates
    const updates = await executeQuery(
      `
            SELECT 
                cu.id,
                cu.update_text,
                cu.created_at,
                u.username as updated_by_username
            FROM case_updates cu
            LEFT JOIN users u ON cu.updated_by = u.id
            WHERE cu.distress_message_id = ?
            ORDER BY cu.created_at DESC
        `,
      [id],
    );

    // Get attachments
    const attachments = await executeQuery(
      `
            SELECT 
                a.id,
                a.file_name,
                a.file_type,
                a.file_size,
                a.uploaded_at,
                u.username as uploaded_by_username
            FROM attachments a
            LEFT JOIN users u ON a.uploaded_by = u.id
            WHERE a.distress_message_id = ?
            ORDER BY a.uploaded_at DESC
        `,
      [id],
    );

    const message = {
      ...messages[0],
      updates,
      attachments,
    };

    logger.info(
      `Retrieved distress message ${id} with ${updates.length} updates and ${attachments.length} attachments`,
    );

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    logger.error("Error fetching distress message by ID from database:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch distress message",
    });
  }
};

// Create new distress message
export const createDistressMessage = async (req, res) => {
  try {
    const {
      sender_name,
      reference_number,
      subject,
      country_of_origin,
      distressed_person_name,
      nature_of_case,
      case_details,
      priority = "medium",
    } = req.body;

    // Validate required fields
    if (
      !sender_name ||
      !subject ||
      !country_of_origin ||
      !distressed_person_name ||
      !nature_of_case
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields: sender_name, subject, country_of_origin, distressed_person_name, nature_of_case",
      });
    }

    if (!isConnected()) {
      logger.warn("Database not connected, cannot create distress message");
      return res.status(503).json({
        success: false,
        message: "Database service unavailable",
        fallback: true,
      });
    }

    // Generate folio number
    const year = new Date().getFullYear();
    const folioPrefix = `DM${year}`;

    // Get next sequence number
    const lastFolio = await executeQuery(
      `
            SELECT folio_number 
            FROM distress_messages 
            WHERE folio_number LIKE ? 
            ORDER BY id DESC 
            LIMIT 1
        `,
      [`${folioPrefix}%`],
    );

    let sequenceNumber = 1;
    if (lastFolio.length > 0) {
      const lastNumber = lastFolio[0].folio_number.replace(folioPrefix, "");
      sequenceNumber = parseInt(lastNumber) + 1;
    }

    const folioNumber = `${folioPrefix}${sequenceNumber.toString().padStart(4, "0")}`;

    // Create distress message
    const result = await executeQuery(
      `
            INSERT INTO distress_messages (
                folio_number,
                sender_name,
                reference_number,
                subject,
                country_of_origin,
                distressed_person_name,
                nature_of_case,
                case_details,
                priority,
                status,
                created_by,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())
        `,
      [
        folioNumber,
        sender_name,
        reference_number,
        subject,
        country_of_origin,
        distressed_person_name,
        nature_of_case,
        case_details,
        priority,
        req.user.id,
      ],
    );

    // Get the created message
    const newMessage = await executeQuery(
      `
            SELECT 
                dm.id,
                dm.folio_number,
                dm.sender_name,
                dm.reference_number,
                dm.subject,
                dm.country_of_origin,
                dm.distressed_person_name,
                dm.nature_of_case,
                dm.case_details,
                dm.priority,
                dm.status,
                dm.created_by,
                dm.created_at,
                u.username as created_by_username
            FROM distress_messages dm
            LEFT JOIN users u ON dm.created_by = u.id
            WHERE dm.id = ?
        `,
      [result.insertId],
    );

    logger.info(
      `Created distress message: ${folioNumber} by user ${req.user.username}`,
    );

    res.status(201).json({
      success: true,
      data: newMessage[0],
      message: "Distress message created successfully",
    });
  } catch (error) {
    logger.error("Error creating distress message in database:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create distress message",
    });
  }
};

// Update distress message
export const updateDistressMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!isConnected()) {
      logger.warn("Database not connected, cannot update distress message");
      return res.status(503).json({
        success: false,
        message: "Database service unavailable",
        fallback: true,
      });
    }

    // Check if message exists
    const existingMessage = await executeQuery(
      `
            SELECT id, status FROM distress_messages WHERE id = ?
        `,
      [id],
    );

    if (existingMessage.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Distress message not found",
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    const allowedFields = [
      "sender_name",
      "reference_number",
      "subject",
      "country_of_origin",
      "distressed_person_name",
      "nature_of_case",
      "case_details",
      "priority",
      "status",
      "assigned_to",
      "resolution_notes",
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updateData[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    // Add special handling for status changes
    if (updateData.status === "resolved" && !updateData.resolved_at) {
      updateFields.push("resolved_at = NOW()");
    }

    if (
      updateData.status &&
      existingMessage[0].status === "pending" &&
      !updateData.first_response_at
    ) {
      updateFields.push("first_response_at = NOW()");
    }

    updateFields.push("updated_at = NOW()");
    updateValues.push(id);

    // Update the message
    await executeQuery(
      `
            UPDATE distress_messages 
            SET ${updateFields.join(", ")} 
            WHERE id = ?
        `,
      updateValues,
    );

    // Get updated message
    const updatedMessage = await executeQuery(
      `
            SELECT 
                dm.id,
                dm.folio_number,
                dm.sender_name,
                dm.reference_number,
                dm.subject,
                dm.country_of_origin,
                dm.distressed_person_name,
                dm.nature_of_case,
                dm.case_details,
                dm.priority,
                dm.status,
                dm.created_by,
                dm.assigned_to,
                dm.created_at,
                dm.updated_at,
                dm.first_response_at,
                dm.resolved_at,
                dm.resolution_notes,
                creator.username as created_by_username,
                assignee.username as assigned_to_username
            FROM distress_messages dm
            LEFT JOIN users creator ON dm.created_by = creator.id
            LEFT JOIN users assignee ON dm.assigned_to = assignee.id
            WHERE dm.id = ?
        `,
      [id],
    );

    logger.info(`Updated distress message ${id} by user ${req.user.username}`);

    res.json({
      success: true,
      data: updatedMessage[0],
      message: "Distress message updated successfully",
    });
  } catch (error) {
    logger.error("Error updating distress message in database:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update distress message",
    });
  }
};

// Add case update
export const addCaseUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { update_text } = req.body;

    if (!update_text || update_text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Update text is required",
      });
    }

    if (!isConnected()) {
      logger.warn("Database not connected, cannot add case update");
      return res.status(503).json({
        success: false,
        message: "Database service unavailable",
        fallback: true,
      });
    }

    // Check if message exists
    const existingMessage = await executeQuery(
      `
            SELECT id FROM distress_messages WHERE id = ?
        `,
      [id],
    );

    if (existingMessage.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Distress message not found",
      });
    }

    // Add case update and update message timestamp in transaction
    const results = await executeTransaction([
      {
        sql: `INSERT INTO case_updates (distress_message_id, updated_by, update_text, created_at) 
                      VALUES (?, ?, ?, NOW())`,
        params: [id, req.user.id, update_text.trim()],
      },
      {
        sql: `UPDATE distress_messages SET updated_at = NOW() WHERE id = ?`,
        params: [id],
      },
    ]);

    // Get the created update
    const newUpdate = await executeQuery(
      `
            SELECT 
                cu.id,
                cu.update_text,
                cu.created_at,
                u.username as updated_by_username
            FROM case_updates cu
            LEFT JOIN users u ON cu.updated_by = u.id
            WHERE cu.id = ?
        `,
      [results[0].insertId],
    );

    logger.info(
      `Added case update to message ${id} by user ${req.user.username}`,
    );

    res.status(201).json({
      success: true,
      data: newUpdate[0],
      message: "Case update added successfully",
    });
  } catch (error) {
    logger.error("Error adding case update to database:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add case update",
    });
  }
};

// Assign distress message
export const assignDistressMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignee_id, instructions } = req.body;

    if (!assignee_id) {
      return res.status(400).json({
        success: false,
        message: "Assignee ID is required",
      });
    }

    if (!isConnected()) {
      logger.warn("Database not connected, cannot assign distress message");
      return res.status(503).json({
        success: false,
        message: "Database service unavailable",
        fallback: true,
      });
    }

    // Check if message exists
    const existingMessage = await executeQuery(
      `
            SELECT id, status FROM distress_messages WHERE id = ?
        `,
      [id],
    );

    if (existingMessage.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Distress message not found",
      });
    }

    // Check if assignee exists
    const assignee = await executeQuery(
      `
            SELECT id, username, role FROM users WHERE id = ? AND is_active = 1
        `,
      [assignee_id],
    );

    if (assignee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Assignee not found or inactive",
      });
    }

    // Perform assignment in transaction
    const results = await executeTransaction([
      {
        sql: `UPDATE distress_messages 
                      SET assigned_to = ?, status = 'assigned', updated_at = NOW(),
                          first_response_at = CASE WHEN first_response_at IS NULL THEN NOW() ELSE first_response_at END
                      WHERE id = ?`,
        params: [assignee_id, id],
      },
      {
        sql: `INSERT INTO case_assignments 
                      (distress_message_id, assigned_by, assigned_to, director_instructions, assignment_date) 
                      VALUES (?, ?, ?, ?, NOW())`,
        params: [id, req.user.id, assignee_id, instructions || null],
      },
    ]);

    // Get updated message
    const updatedMessage = await executeQuery(
      `
            SELECT 
                dm.id,
                dm.folio_number,
                dm.subject,
                dm.status,
                dm.priority,
                dm.assigned_to,
                u.username as assigned_to_username
            FROM distress_messages dm
            LEFT JOIN users u ON dm.assigned_to = u.id
            WHERE dm.id = ?
        `,
      [id],
    );

    logger.info(
      `Assigned distress message ${id} to ${assignee[0].username} by ${req.user.username}`,
    );

    res.json({
      success: true,
      data: updatedMessage[0],
      message: `Distress message assigned to ${assignee[0].username} successfully`,
    });
  } catch (error) {
    logger.error("Error assigning distress message in database:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign distress message",
    });
  }
};

// Get distress message statistics
export const getDistressMessageStatistics = async (req, res) => {
  try {
    if (!isConnected()) {
      logger.warn("Database not connected, returning mock statistics");
      return res.json({
        success: true,
        data: {
          total: 0,
          byStatus: {},
          byPriority: {},
          avgResponseTime: 0,
          avgResolutionTime: 0,
        },
        fallback: true,
      });
    }

    // Get statistics
    const totalStats = await executeQuery(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
                AVG(CASE WHEN first_response_at IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, created_at, first_response_at)
                    ELSE NULL END) as avg_response_time,
                AVG(CASE WHEN resolved_at IS NOT NULL
                    THEN TIMESTAMPDIFF(HOUR, created_at, resolved_at)
                    ELSE NULL END) as avg_resolution_time
            FROM distress_messages
        `);

    const priorityStats = await executeQuery(`
            SELECT priority, COUNT(*) as count
            FROM distress_messages
            GROUP BY priority
        `);

    const stats = totalStats[0];

    const data = {
      total: parseInt(stats.total),
      byStatus: {
        pending: parseInt(stats.pending),
        assigned: parseInt(stats.assigned),
        in_progress: parseInt(stats.in_progress),
        resolved: parseInt(stats.resolved),
      },
      byPriority: priorityStats.reduce((acc, row) => {
        acc[row.priority] = parseInt(row.count);
        return acc;
      }, {}),
      avgResponseTime: Math.round(stats.avg_response_time || 0),
      avgResolutionTime: Math.round(stats.avg_resolution_time || 0),
    };

    logger.info("Retrieved distress message statistics from database");

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error(
      "Error fetching distress message statistics from database:",
      error,
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};

// Delete distress message (admin only)
export const deleteDistressMessage = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admins can delete messages
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can delete distress messages",
      });
    }

    if (!isConnected()) {
      logger.warn("Database not connected, cannot delete distress message");
      return res.status(503).json({
        success: false,
        message: "Database service unavailable",
        fallback: true,
      });
    }

    // Check if message exists
    const existingMessage = await executeQuery(
      `
            SELECT id, folio_number FROM distress_messages WHERE id = ?
        `,
      [id],
    );

    if (existingMessage.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Distress message not found",
      });
    }

    // Delete in transaction (cascade deletes will handle related records)
    await executeTransaction([
      {
        sql: "DELETE FROM case_updates WHERE distress_message_id = ?",
        params: [id],
      },
      {
        sql: "DELETE FROM case_assignments WHERE distress_message_id = ?",
        params: [id],
      },
      {
        sql: "DELETE FROM attachments WHERE distress_message_id = ?",
        params: [id],
      },
      {
        sql: "DELETE FROM distress_messages WHERE id = ?",
        params: [id],
      },
    ]);

    logger.info(
      `Deleted distress message ${existingMessage[0].folio_number} (ID: ${id}) by admin ${req.user.username}`,
    );

    res.json({
      success: true,
      message: "Distress message deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting distress message from database:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete distress message",
    });
  }
};
