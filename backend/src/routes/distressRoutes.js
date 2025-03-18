import { Router } from 'express';
import distressController from '../controllers/distressMessageController.js';
import { authenticateToken } from '../middleware/auth.js';
import { distressMessageSchemas, commonSchemas } from '../utils/validationSchemas.js';
import { validateRequest } from '../middleware/validation.js';

const router = Router();

// Get messages with pagination and filtering
router.get(
    '/',
    validateRequest({ query: commonSchemas.pagination.merge(commonSchemas.sorting) }),
    authenticateToken,
    distressController.getMessages.bind(distressController)
);

// Get dashboard statistics
router.get(
    '/statistics',
    authenticateToken,
    distressController.getStatistics.bind(distressController)
);

// Create a new message
router.post(
    '/',
    validateRequest({ body: distressMessageSchemas.create }),
    authenticateToken,
    distressController.createMessage.bind(distressController)
);

// Get a specific message
router.get(
    '/:id',
    authenticateToken,
    distressController.getMessage.bind(distressController)
);

// Update a message
router.put(
    '/:id',
    validateRequest({ body: distressMessageSchemas.update }),
    authenticateToken,
    distressController.updateMessage.bind(distressController)
);

// Assign a message
router.post(
    '/:id/assign',
    validateRequest({ body: commonSchemas.assign }),
    authenticateToken,
    distressController.assignMessage.bind(distressController)
);

export default router;
