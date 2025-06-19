import notificationService from "../services/notificationService.js";
import { executeQuery } from "../db.js";

class DistressMessageController {
  constructor() {
    this.tableName = "distress_messages";
  }

  // Helper method to build WHERE clause from filters
  buildWhereClause(filters = {}) {
    const conditions = [];
    const values = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          conditions.push(`${key} IN (?)`);
          values.push(value);
        } else if (typeof value === "string" && value.includes("%")) {
          conditions.push(`${key} LIKE ?`);
          values.push(value);
        } else {
          conditions.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    return {
      whereClause: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
      values,
    };
  }

  // Helper method to build ORDER BY clause
  buildOrderClause(sortBy = "created_at", sortOrder = "desc") {
    // Validate sort field to prevent SQL injection
    const validSortFields = [
      "id",
      "created_at",
      "updated_at",
      "status",
      "priority",
    ];
    const sanitizedSortBy = validSortFields.includes(sortBy)
      ? sortBy
      : "created_at";
    const sanitizedSortOrder =
      sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

    return `ORDER BY ${sanitizedSortBy} ${sanitizedSortOrder}`;
  }

  // Helper method to build LIMIT clause for pagination
  buildLimitClause(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    return `LIMIT ? OFFSET ?`;
  }

  // Generic method to get paginated and filtered results
  async list({ filters = {}, page = 1, limit = 10, sortBy, sortOrder } = {}) {
    try {
      const { whereClause, values } = this.buildWhereClause(filters);
      const orderClause = this.buildOrderClause(sortBy, sortOrder);
      const limitClause = this.buildLimitClause(page, limit);

      // Get total count
      const countResult = await executeQuery(
        `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`,
        values,
      );
      const total = Array.isArray(countResult)
        ? countResult[0].total
        : countResult.total;

      // Get paginated data
      const data = await executeQuery(
        `SELECT * FROM ${this.tableName} ${whereClause} ${orderClause} ${limitClause}`,
        [...values, limit, (page - 1) * limit],
      );

      return {
        data,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("Error in list method:", error);
      throw error;
    }
  }

  // Get messages with pagination, filtering, and sorting
  async getMessages(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "created_at",
        sortOrder = "desc",
        status,
        priority,
        assigned_to,
        created_by,
        search,
      } = req.query;

      // Build filters
      const filters = {};
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (assigned_to) filters.assigned_to = parseInt(assigned_to);
      if (created_by) filters.created_by = parseInt(created_by);
      if (search) {
        filters.search = [
          { folio_number: `%${search}%` },
          { subject: `%${search}%` },
          { sender_name: `%${search}%` },
          { distressed_person_name: `%${search}%` },
        ];
      }

      const result = await this.list(req.app.locals.pool, {
        filters,
        page,
        limit,
        sortBy,
        sortOrder,
      });

      // Get related user information
      const userIds = new Set();
      result.data.forEach((msg) => {
        if (msg.created_by) userIds.add(msg.created_by);
        if (msg.assigned_to) userIds.add(msg.assigned_to);
      });

      if (userIds.size > 0) {
        const [users] = await req.app.locals.pool.execute(
          "SELECT id, username, role FROM users WHERE id IN (?)",
          [Array.from(userIds)],
        );

        const userMap = new Map(users.map((user) => [user.id, user]));
        result.data = result.data.map((msg) => ({
          ...msg,
          created_by_user: msg.created_by ? userMap.get(msg.created_by) : null,
          assigned_to_user: msg.assigned_to
            ? userMap.get(msg.assigned_to)
            : null,
        }));
      }

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Error in getMessages:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch messages",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Create a new message
  async createMessage(req, res) {
    try {
      const {
        sender_name,
        subject,
        country_of_origin,
        distressed_person_name,
        nature_of_case,
        case_details,
        priority = "medium",
      } = req.body;

      // Generate folio number
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");

      const [lastFolio] = await req.app.locals.pool.execute(
        "SELECT folio_number FROM distress_messages WHERE folio_number LIKE ? ORDER BY id DESC LIMIT 1",
        [`DM${year}${month}%`],
      );

      let sequence = 1;
      if (lastFolio.length > 0) {
        const lastSequence = parseInt(lastFolio[0].folio_number.slice(-4));
        sequence = lastSequence + 1;
      }

      const folioNumber = `DM${year}${month}${String(sequence).padStart(4, "0")}`;

      const messageData = {
        folio_number: folioNumber,
        sender_name,
        subject,
        country_of_origin,
        distressed_person_name,
        nature_of_case,
        case_details,
        priority,
        status: "pending",
        created_by: req.user.id,
      };

      const [result] = await req.app.locals.pool.execute(
        `INSERT INTO ${this.tableName} (
                    folio_number,
                    sender_name,
                    subject,
                    country_of_origin,
                    distressed_person_name,
                    nature_of_case,
                    case_details,
                    priority,
                    status,
                    created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          folioNumber,
          sender_name,
          subject,
          country_of_origin,
          distressed_person_name,
          nature_of_case,
          case_details,
          priority,
          "pending",
          req.user.id,
        ],
      );

      // Notify directors about new distress message
      await notificationService.notifyRole("director", {
        type: "new_distress_message",
        title: "New Distress Message",
        message: `New distress message received: ${subject}`,
        data: {
          messageId: result.insertId,
          folioNumber,
          priority,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: result.insertId,
          folio_number: folioNumber,
        },
      });
    } catch (error) {
      console.error("Error in createMessage:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create message",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Get a single message by ID with related data
  async getMessage(req, res) {
    try {
      const { id } = req.params;

      // Get message with user information
      const [message] = await req.app.locals.pool.execute(
        `SELECT
                    m.*,
                    creator.username as created_by_username,
                    creator.email as created_by_email,
                    assignee.username as assigned_to_username,
                    assignee.email as assigned_to_email
                FROM distress_messages m
                LEFT JOIN users creator ON m.created_by = creator.id
                LEFT JOIN users assignee ON m.assigned_to = assignee.id
                WHERE m.id = ?`,
        [id],
      );

      if (!message[0]) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      // Get case updates
      const [updates] = await req.app.locals.pool.execute(
        `SELECT
                    cu.*,
                    u.username as updated_by_username
                FROM case_updates cu
                LEFT JOIN users u ON cu.updated_by = u.id
                WHERE cu.distress_message_id = ?
                ORDER BY cu.created_at DESC`,
        [id],
      );

      // Get attachments
      const [attachments] = await req.app.locals.pool.execute(
        `SELECT
                    a.*,
                    u.username as uploaded_by_username
                FROM attachments a
                LEFT JOIN users u ON a.uploaded_by = u.id
                WHERE a.distress_message_id = ?
                ORDER BY a.uploaded_at DESC`,
        [id],
      );

      res.json({
        success: true,
        data: {
          ...message[0],
          updates,
          attachments,
        },
      });
    } catch (error) {
      console.error("Error in getMessage:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch message",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Update a message
  async updateMessage(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Get current message
      const [currentMessage] = await req.app.locals.pool.execute(
        "SELECT * FROM distress_messages WHERE id = ?",
        [id],
      );

      if (!currentMessage[0]) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      const [result] = await req.app.locals.pool.execute(
        `UPDATE distress_messages
                 SET
                     sender_name = ?,
                     subject = ?,
                     country_of_origin = ?,
                     distressed_person_name = ?,
                     nature_of_case = ?,
                     case_details = ?,
                     priority = ?,
                     status = ?,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
        [
          updates.sender_name,
          updates.subject,
          updates.country_of_origin,
          updates.distressed_person_name,
          updates.nature_of_case,
          updates.case_details,
          updates.priority,
          updates.status,
          id,
        ],
      );

      // Notify relevant users about the update
      const notificationData = {
        type: "distress_message_updated",
        title: "Distress Message Updated",
        message: `Distress message ${currentMessage[0].folio_number} has been updated`,
        data: {
          messageId: id,
          folioNumber: currentMessage[0].folio_number,
          updates,
        },
      };

      // Notify assigned cadet if exists
      if (currentMessage[0].assigned_to) {
        await notificationService.notify(
          currentMessage[0].assigned_to,
          notificationData,
        );
      }

      // Notify directors about status changes
      if (updates.status && updates.status !== currentMessage[0].status) {
        await notificationService.notifyRole("director", {
          ...notificationData,
          message: `Distress message ${currentMessage[0].folio_number} status changed to ${updates.status}`,
        });
      }

      res.json({
        success: true,
        data: {
          id,
          ...updates,
        },
      });
    } catch (error) {
      console.error("Error in updateMessage:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update message",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Assign a message
  async assignMessage(req, res) {
    try {
      const { id } = req.params;
      const { assigned_to, director_instructions } = req.body;

      // Get current message
      const [currentMessage] = await req.app.locals.pool.execute(
        "SELECT * FROM distress_messages WHERE id = ?",
        [id],
      );

      if (!currentMessage[0]) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      // Get assignee details
      const [assignee] = await req.app.locals.pool.execute(
        "SELECT id, username, role FROM users WHERE id = ?",
        [assigned_to],
      );

      if (!assignee[0] || assignee[0].role !== "cadet") {
        return res.status(400).json({
          success: false,
          message: "Invalid assignee - must be a cadet",
        });
      }

      // Update message assignment
      const [result] = await req.app.locals.pool.execute(
        `UPDATE distress_messages
                 SET assigned_to = ?,
                     status = 'assigned',
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
        [assigned_to, id],
      );

      // Create assignment record
      await req.app.locals.pool.execute(
        `INSERT INTO case_assignments (
                    distress_message_id,
                    assigned_to,
                    assigned_by,
                    notes,
                    status
                ) VALUES (?, ?, ?, ?, 'active')`,
        [id, assigned_to, req.user.id, director_instructions],
      );

      // Notify assigned cadet
      await notificationService.notify(assigned_to, {
        type: "case_assigned",
        title: "New Case Assignment",
        message: `You have been assigned to handle distress message: ${currentMessage[0].subject}`,
        data: {
          messageId: id,
          folioNumber: currentMessage[0].folio_number,
          priority: currentMessage[0].priority,
        },
      });

      res.json({
        success: true,
        message: "Message assigned successfully",
      });
    } catch (error) {
      console.error("Error in assignMessage:", error);
      res.status(500).json({
        success: false,
        message: "Failed to assign message",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Get dashboard statistics
  async getStatistics(req, res) {
    try {
      const connection = await req.app.locals.pool.getConnection();

      try {
        // Get counts by status
        const [statusCounts] = await connection.execute(
          "SELECT status, COUNT(*) as count FROM distress_messages GROUP BY status",
        );

        // Get counts by priority
        const [priorityCounts] = await connection.execute(
          "SELECT priority, COUNT(*) as count FROM distress_messages GROUP BY priority",
        );

        // Get counts by country
        const [countryCounts] = await connection.execute(
          "SELECT country_of_origin, COUNT(*) as count FROM distress_messages GROUP BY country_of_origin",
        );

        // Get recent messages
        const [recentMessages] = await connection.execute(
          `SELECT
                        m.*,
                        creator.username as created_by_username,
                        assignee.username as assigned_to_username
                    FROM distress_messages m
                    LEFT JOIN users creator ON m.created_by = creator.id
                    LEFT JOIN users assignee ON m.assigned_to = assignee.id
                    ORDER BY m.created_at DESC
                    LIMIT 5`,
        );

        res.json({
          success: true,
          data: {
            statusCounts,
            priorityCounts,
            countryCounts,
            recentMessages,
          },
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Error in getStatistics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch statistics",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

export default new DistressMessageController();
