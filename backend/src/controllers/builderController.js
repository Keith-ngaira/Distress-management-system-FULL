import builderService from "../services/builderService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../middleware/logger.js";

/**
 * Test Builder.io connection
 */
export const testBuilderConnection = asyncHandler(async (req, res) => {
  const result = await builderService.testConnection();

  res.json({
    success: true,
    message: "Builder.io connection test completed",
    data: result,
  });
});

/**
 * Sync a single distress message to Builder.io
 */
export const syncDistressMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { messageData } = req.body;

  if (!messageData) {
    return res.status(400).json({
      success: false,
      message: "Message data is required",
    });
  }

  const result = await builderService.syncDistressMessage(messageData);

  res.json({
    success: true,
    message: "Distress message synced to Builder.io",
    data: result,
  });
});

/**
 * Update a distress message in Builder.io
 */
export const updateDistressMessage = asyncHandler(async (req, res) => {
  const { builderId } = req.params;
  const { messageData } = req.body;

  if (!messageData) {
    return res.status(400).json({
      success: false,
      message: "Message data is required",
    });
  }

  const result = await builderService.updateDistressMessage(
    builderId,
    messageData,
  );

  res.json({
    success: true,
    message: "Distress message updated in Builder.io",
    data: result,
  });
});

/**
 * Bulk sync all distress messages to Builder.io
 */
export const bulkSyncDistressMessages = asyncHandler(async (req, res) => {
  logger.info("Starting bulk sync to Builder.io", { userId: req.user.id });

  const result = await builderService.bulkSyncDistressMessages();

  res.json({
    success: true,
    message: "Bulk sync to Builder.io completed",
    data: result,
  });
});

/**
 * Sync a user to Builder.io
 */
export const syncUser = asyncHandler(async (req, res) => {
  const { userData } = req.body;

  if (!userData) {
    return res.status(400).json({
      success: false,
      message: "User data is required",
    });
  }

  const result = await builderService.syncUser(userData);

  res.json({
    success: true,
    message: "User synced to Builder.io",
    data: result,
  });
});

/**
 * Sync a case update to Builder.io
 */
export const syncCaseUpdate = asyncHandler(async (req, res) => {
  const { updateData } = req.body;

  if (!updateData) {
    return res.status(400).json({
      success: false,
      message: "Update data is required",
    });
  }

  const result = await builderService.syncCaseUpdate(updateData);

  res.json({
    success: true,
    message: "Case update synced to Builder.io",
    data: result,
  });
});

/**
 * Get Builder.io model schemas for setup
 */
export const getModelSchemas = asyncHandler(async (req, res) => {
  const schemas = builderService.getModelSchemas();

  res.json({
    success: true,
    message: "Builder.io model schemas",
    data: schemas,
  });
});

/**
 * Get Builder.io sync status and configuration
 */
export const getSyncStatus = asyncHandler(async (req, res) => {
  const connection = await builderService.testConnection();

  res.json({
    success: true,
    message: "Builder.io sync status",
    data: {
      connection,
      models: builderService.models,
      apiConfigured: !!process.env.BUILDER_API_KEY,
    },
  });
});
