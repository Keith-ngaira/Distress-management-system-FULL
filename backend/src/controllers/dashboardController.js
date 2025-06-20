import { executeQuery } from "../db.js";
import { logger } from "../middleware/logger.js";
import {
  mockDashboardData,
  mockDirectorData,
  mockFrontOfficeData,
  mockCadetData,
} from "./mockData.js";

export const getDashboardData = async (req, res) => {
  try {
    // Try MySQL first
    const caseStats = await executeQuery(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
                AVG(CASE WHEN first_response_at IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, created_at, first_response_at)
                    ELSE NULL END) as avg_first_response,
                AVG(CASE WHEN resolved_at IS NOT NULL
                    THEN TIMESTAMPDIFF(HOUR, created_at, resolved_at)
                    ELSE NULL END) as avg_resolution_time
            FROM distress_messages
        `);

    const priorityStats = await executeQuery(`
            SELECT
                priority,
                COUNT(*) as count,
                AVG(CASE WHEN first_response_at IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, created_at, first_response_at)
                    ELSE NULL END) as avg_first_response
            FROM distress_messages
            GROUP BY priority
            ORDER BY FIELD(priority, 'urgent', 'high', 'medium', 'low')
        `);

    const caseCategories = await executeQuery(`
            SELECT nature_of_case as name, COUNT(*) as count
            FROM distress_messages
            GROUP BY nature_of_case
            ORDER BY count DESC
            LIMIT 5
        `);

    const recentCases = await executeQuery(`
            SELECT
                m.id,
                m.subject,
                m.status,
                m.priority,
                m.created_at,
                COALESCE(u.username, 'Unassigned') as assigned_to
            FROM distress_messages m
            LEFT JOIN users u ON m.assigned_to = u.id
            ORDER BY m.created_at DESC
            LIMIT 5
        `);

    const baseData = {
      stats: {
        total: parseInt(caseStats[0]?.total || 0),
        pending: parseInt(caseStats[0]?.pending || 0),
        assigned: parseInt(caseStats[0]?.assigned || 0),
        active: parseInt(caseStats[0]?.active || 0),
        resolved: parseInt(caseStats[0]?.resolved || 0),
        avgFirstResponse: Math.round(caseStats[0]?.avg_first_response || 0),
        avgResolutionTime: Math.round(caseStats[0]?.avg_resolution_time || 0),
      },
      priorityStats: priorityStats.map((stat) => ({
        priority: stat.priority,
        count: parseInt(stat.count),
        avgFirstResponse: Math.round(stat.avg_first_response || 0),
      })),
      caseCategories: caseCategories.map((cat) => ({
        name: cat.name,
        count: parseInt(cat.count),
      })),
      recentCases: recentCases.map((c) => ({
        id: c.id,
        subject: c.subject,
        status: c.status,
        priority: c.priority,
        createdAt: c.created_at,
        assignedTo: c.assigned_to,
      })),
    };

    // Add role-specific data when MySQL is available
    if (req.user?.role === "director") {
      // For now, when MySQL is available, we'll use mock director data
      // In production, this would fetch real director-specific data from database
      return res.json({
        success: true,
        data: { ...baseData, ...mockDirectorData },
      });
    }

    if (req.user?.role === "front_office") {
      // For now, when MySQL is available, we'll use mock front office data
      // In production, this would fetch real front office-specific data from database
      return res.json({
        success: true,
        data: { ...baseData, ...mockFrontOfficeData },
      });
    }

    if (req.user?.role === "cadet") {
      // For now, when MySQL is available, we'll use mock cadet data
      // In production, this would fetch real cadet-specific data from database
      return res.json({
        success: true,
        data: { ...baseData, ...mockCadetData },
      });
    }

    return res.json({
      success: true,
      data: baseData,
    });
  } catch (error) {
    logger.error("Error fetching dashboard data, using mock data:", error);

    // Fallback to mock data when MySQL is unavailable
    const userData = req.user;
    let responseData = mockDashboardData;

    if (userData?.role === "director") {
      responseData = mockDirectorData;
    } else if (userData?.role === "front_office") {
      responseData = mockFrontOfficeData;
    } else if (userData?.role === "cadet") {
      responseData = mockCadetData;
    }

    return res.json({
      success: true,
      data: responseData,
    });
  }
};
