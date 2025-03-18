import db, { executeQuery } from '../db.js';
import { logger } from '../middleware/logger.js';

export const getDashboardData = async (req, res) => {
    try {
        // Get all stats in a single query for better performance
        const [stats] = await executeQuery(`
            SELECT
                (SELECT COUNT(*)) as total,
                (SELECT COUNT(*) WHERE status = 'pending') as pending,
                (SELECT COUNT(*) WHERE status = 'assigned') as assigned,
                (SELECT COUNT(*) WHERE status = 'in_progress') as active,
                (SELECT COUNT(*) WHERE status = 'resolved') as resolved,
                (SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, first_response_at))
                    WHERE first_response_at IS NOT NULL) as avg_first_response,
                (SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at))
                    WHERE resolved_at IS NOT NULL) as avg_resolution_time
            FROM distress_messages
        `);

        // Get priority stats in a single query
        const [priorityStats] = await executeQuery(`
            SELECT
                priority,
                COUNT(*) as count,
                AVG(TIMESTAMPDIFF(MINUTE, created_at, first_response_at)) as avg_first_response
            FROM distress_messages
            WHERE first_response_at IS NOT NULL
            GROUP BY priority
            ORDER BY FIELD(priority, 'urgent', 'high', 'medium', 'low')
        `);

        // Get top 5 case categories
        const [caseCategories] = await executeQuery(`
            SELECT nature_of_case as name, COUNT(*) as count
            FROM distress_messages
            GROUP BY nature_of_case
            ORDER BY count DESC
            LIMIT 5
        `);

        // Get recent cases with limited fields
        const [recentCases] = await executeQuery(`
            SELECT
                m.id,
                m.subject,
                m.status,
                m.priority,
                m.created_at,
                COALESCE(u.full_name, 'Unassigned') as assigned_to
            FROM distress_messages m
            LEFT JOIN users u ON m.assigned_to = u.id
            ORDER BY m.created_at DESC
            LIMIT 5
        `);

        // Return formatted response
        return res.json({
            success: true,
            data: {
                stats: {
                    total: stats.total || 0,
                    pending: stats.pending || 0,
                    assigned: stats.assigned || 0,
                    active: stats.active || 0,
                    resolved: stats.resolved || 0,
                    avgFirstResponse: Math.round(stats.avg_first_response || 0),
                    avgResolutionTime: Math.round(stats.avg_resolution_time || 0)
                },
                priorityStats: priorityStats.map(stat => ({
                    priority: stat.priority,
                    count: stat.count,
                    avgFirstResponse: Math.round(stat.avg_first_response || 0)
                })),
                caseCategories,
                recentCases: recentCases.map(c => ({
                    id: c.id,
                    subject: c.subject,
                    status: c.status,
                    priority: c.priority,
                    createdAt: c.created_at,
                    assignedTo: c.assigned_to
                }))
            }
        });
    } catch (error) {
        logger.error('Error fetching dashboard data:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
