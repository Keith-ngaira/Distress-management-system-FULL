import api from "./api";

class BuilderService {
  /**
   * Test Builder.io connection
   */
  async testConnection() {
    try {
      const response = await api.get("/builder/test-connection");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to test Builder.io connection",
      );
    }
  }

  /**
   * Get Builder.io sync status
   */
  async getSyncStatus() {
    try {
      const response = await api.get("/builder/status");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to get sync status",
      );
    }
  }

  /**
   * Get Builder.io model schemas
   */
  async getModelSchemas() {
    try {
      const response = await api.get("/builder/schemas");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to get model schemas",
      );
    }
  }

  /**
   * Sync a distress message to Builder.io
   */
  async syncDistressMessage(messageId, messageData) {
    try {
      const response = await api.post(
        `/builder/sync/distress-message/${messageId}`,
        {
          messageData,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to sync distress message",
      );
    }
  }

  /**
   * Update a distress message in Builder.io
   */
  async updateDistressMessage(builderId, messageData) {
    try {
      const response = await api.patch(
        `/builder/sync/distress-message/${builderId}`,
        {
          messageData,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update distress message",
      );
    }
  }

  /**
   * Bulk sync all distress messages to Builder.io
   */
  async bulkSyncDistressMessages() {
    try {
      const response = await api.post("/builder/sync/bulk/distress-messages");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to bulk sync distress messages",
      );
    }
  }

  /**
   * Sync a user to Builder.io
   */
  async syncUser(userData) {
    try {
      const response = await api.post("/builder/sync/user", {
        userData,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to sync user");
    }
  }

  /**
   * Sync a case update to Builder.io
   */
  async syncCaseUpdate(updateData) {
    try {
      const response = await api.post("/builder/sync/case-update", {
        updateData,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to sync case update",
      );
    }
  }
}

export const builderService = new BuilderService();
export default builderService;
