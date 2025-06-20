import axios from "axios";
import { logger } from "../middleware/logger.js";
import { executeQuery } from "../db.js";
import dotenv from "dotenv";

dotenv.config();

class BuilderService {
  constructor() {
    this.apiKey = process.env.BUILDER_API_KEY;
    this.apiUrl = "https://builder.io/api/v1";
    this.models = {
      distressMessages:
        process.env.BUILDER_DISTRESS_MODEL || "distress-messages",
      users: process.env.BUILDER_USERS_MODEL || "users",
      caseUpdates: process.env.BUILDER_CASE_UPDATES_MODEL || "case-updates",
      notifications: process.env.BUILDER_NOTIFICATIONS_MODEL || "notifications",
    };

    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
  }

  /**
   * Sync a distress message to Builder.io
   */
  async syncDistressMessage(messageData) {
    try {
      if (!this.apiKey) {
        logger.warn("Builder.io API key not configured, skipping sync");
        return null;
      }

      const payload = {
        name: `${messageData.folio_number} - ${messageData.subject}`,
        data: {
          folio_number: messageData.folio_number,
          sender_name: messageData.sender_name,
          reference_number: messageData.reference_number,
          subject: messageData.subject,
          country_of_origin: messageData.country_of_origin,
          distressed_person_name: messageData.distressed_person_name,
          nature_of_case: messageData.nature_of_case,
          case_details: messageData.case_details,
          priority: messageData.priority,
          status: messageData.status,
          created_by: messageData.created_by,
          assigned_to: messageData.assigned_to,
          created_at: messageData.created_at,
          updated_at: messageData.updated_at,
          first_response_at: messageData.first_response_at,
          resolved_at: messageData.resolved_at,
          resolution_notes: messageData.resolution_notes,
          external_id: messageData.id.toString(), // Track MySQL ID
        },
        published: "published",
      };

      const response = await this.client.post(
        `/write/${this.models.distressMessages}`,
        payload,
      );

      logger.info(
        `Synced distress message ${messageData.folio_number} to Builder.io`,
        {
          builderId: response.data.id,
          mysqlId: messageData.id,
        },
      );

      return response.data;
    } catch (error) {
      logger.error("Failed to sync distress message to Builder.io:", {
        error: error.message,
        messageId: messageData.id,
        folio: messageData.folio_number,
      });
      throw error;
    }
  }

  /**
   * Update an existing Builder.io entry
   */
  async updateDistressMessage(builderId, messageData) {
    try {
      if (!this.apiKey) {
        logger.warn("Builder.io API key not configured, skipping update");
        return null;
      }

      const payload = {
        data: {
          folio_number: messageData.folio_number,
          sender_name: messageData.sender_name,
          reference_number: messageData.reference_number,
          subject: messageData.subject,
          country_of_origin: messageData.country_of_origin,
          distressed_person_name: messageData.distressed_person_name,
          nature_of_case: messageData.nature_of_case,
          case_details: messageData.case_details,
          priority: messageData.priority,
          status: messageData.status,
          created_by: messageData.created_by,
          assigned_to: messageData.assigned_to,
          created_at: messageData.created_at,
          updated_at: messageData.updated_at,
          first_response_at: messageData.first_response_at,
          resolved_at: messageData.resolved_at,
          resolution_notes: messageData.resolution_notes,
          external_id: messageData.id.toString(),
        },
      };

      const response = await this.client.patch(
        `/write/${this.models.distressMessages}/${builderId}`,
        payload,
      );

      logger.info(
        `Updated distress message ${messageData.folio_number} in Builder.io`,
        {
          builderId,
          mysqlId: messageData.id,
        },
      );

      return response.data;
    } catch (error) {
      logger.error("Failed to update distress message in Builder.io:", {
        error: error.message,
        builderId,
        messageId: messageData.id,
      });
      throw error;
    }
  }

  /**
   * Sync user data to Builder.io
   */
  async syncUser(userData) {
    try {
      if (!this.apiKey) {
        return null;
      }

      const payload = {
        name: `${userData.username} (${userData.role})`,
        data: {
          username: userData.username,
          email: userData.email,
          role: userData.role,
          is_active: userData.is_active,
          last_login: userData.last_login,
          created_at: userData.created_at,
          updated_at: userData.updated_at,
          external_id: userData.id.toString(),
        },
        published: "published",
      };

      const response = await this.client.post(
        `/write/${this.models.users}`,
        payload,
      );

      logger.info(`Synced user ${userData.username} to Builder.io`, {
        builderId: response.data.id,
        mysqlId: userData.id,
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to sync user to Builder.io:", {
        error: error.message,
        userId: userData.id,
        username: userData.username,
      });
      throw error;
    }
  }

  /**
   * Bulk sync all distress messages
   */
  async bulkSyncDistressMessages() {
    try {
      logger.info("Starting bulk sync of distress messages to Builder.io");

      const messages = await executeQuery(`
                SELECT dm.*, 
                       u1.username as created_by_username,
                       u2.username as assigned_to_username
                FROM distress_messages dm
                LEFT JOIN users u1 ON dm.created_by = u1.id
                LEFT JOIN users u2 ON dm.assigned_to = u2.id
                ORDER BY dm.created_at DESC
            `);

      const results = [];
      for (const message of messages) {
        try {
          const result = await this.syncDistressMessage(message);
          results.push({
            success: true,
            messageId: message.id,
            builderId: result?.id,
          });

          // Add delay to avoid overwhelming the API
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          results.push({
            success: false,
            messageId: message.id,
            error: error.message,
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      logger.info(
        `Bulk sync completed: ${successCount} success, ${failureCount} failures`,
      );

      return {
        total: messages.length,
        success: successCount,
        failures: failureCount,
        results,
      };
    } catch (error) {
      logger.error("Bulk sync failed:", error);
      throw error;
    }
  }

  /**
   * Sync case updates to Builder.io
   */
  async syncCaseUpdate(updateData) {
    try {
      if (!this.apiKey) {
        return null;
      }

      const payload = {
        name: `Update for ${updateData.folio_number || "Case"} - ${new Date(updateData.created_at).toISOString()}`,
        data: {
          distress_message_id: updateData.distress_message_id,
          folio_number: updateData.folio_number,
          updated_by: updateData.updated_by,
          updated_by_username: updateData.updated_by_username,
          update_text: updateData.update_text,
          created_at: updateData.created_at,
          external_id: updateData.id.toString(),
        },
        published: "published",
      };

      const response = await this.client.post(
        `/write/${this.models.caseUpdates}`,
        payload,
      );

      logger.info(`Synced case update to Builder.io`, {
        builderId: response.data.id,
        updateId: updateData.id,
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to sync case update to Builder.io:", {
        error: error.message,
        updateId: updateData.id,
      });
      throw error;
    }
  }

  /**
   * Check if Builder.io is configured and accessible
   */
  async testConnection() {
    try {
      if (!this.apiKey) {
        return { connected: false, error: "API key not configured" };
      }

      // Test with a simple query to check if we can access the API
      const response = await this.client.get(
        `/content/${this.models.distressMessages}?limit=1`,
      );

      return {
        connected: true,
        message: "Builder.io connection successful",
        modelsConfigured: this.models,
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        hint: "Check your BUILDER_API_KEY and model names in .env",
      };
    }
  }

  /**
   * Setup Builder.io data models (for initial configuration)
   */
  getModelSchemas() {
    return {
      distressMessages: {
        name: "Distress Messages",
        kind: "data",
        fields: [
          { name: "folio_number", type: "string", required: true },
          { name: "sender_name", type: "string", required: true },
          { name: "reference_number", type: "string" },
          { name: "subject", type: "string", required: true },
          { name: "country_of_origin", type: "string" },
          { name: "distressed_person_name", type: "string" },
          { name: "nature_of_case", type: "longText" },
          { name: "case_details", type: "longText" },
          {
            name: "priority",
            type: "enum",
            enum: ["low", "medium", "high", "urgent"],
          },
          {
            name: "status",
            type: "enum",
            enum: ["pending", "assigned", "in_progress", "resolved"],
          },
          { name: "created_by", type: "number" },
          { name: "assigned_to", type: "number" },
          { name: "created_at", type: "date" },
          { name: "updated_at", type: "date" },
          { name: "first_response_at", type: "date" },
          { name: "resolved_at", type: "date" },
          { name: "resolution_notes", type: "longText" },
          { name: "external_id", type: "string", required: true },
        ],
      },
      users: {
        name: "Users",
        kind: "data",
        fields: [
          { name: "username", type: "string", required: true },
          { name: "email", type: "string", required: true },
          {
            name: "role",
            type: "enum",
            enum: ["admin", "director", "front_office", "cadet"],
          },
          { name: "is_active", type: "boolean" },
          { name: "last_login", type: "date" },
          { name: "created_at", type: "date" },
          { name: "updated_at", type: "date" },
          { name: "external_id", type: "string", required: true },
        ],
      },
      caseUpdates: {
        name: "Case Updates",
        kind: "data",
        fields: [
          { name: "distress_message_id", type: "number", required: true },
          { name: "folio_number", type: "string" },
          { name: "updated_by", type: "number", required: true },
          { name: "updated_by_username", type: "string" },
          { name: "update_text", type: "longText", required: true },
          { name: "created_at", type: "date" },
          { name: "external_id", type: "string", required: true },
        ],
      },
    };
  }
}

export default new BuilderService();
