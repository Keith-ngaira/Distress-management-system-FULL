import express from 'express';
import { getDashboardData } from '../controllers/dashboardController.js';
import { authenticateToken, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard data - ensure authentication before checking permissions
router.get('/', authenticateToken, checkPermission('dashboard', 'view'), getDashboardData);

export default router;

export { router as dashboardRoutes };
