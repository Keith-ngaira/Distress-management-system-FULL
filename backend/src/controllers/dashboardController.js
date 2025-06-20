import { executeQuery, isConnected } from "../db.js";
import { logger } from "../middleware/logger.js";
import {
  mockDashboardData,
  mockDirectorData,
  mockFrontOfficeData,
  mockCadetData,
} from "./mockData.js";

export const getDashboardData = async (req, res) => {
  try {
    // Check if database is connected, otherwise use mock data
    if (!isConnected()) {
      logger.warn("Database not connected, using mock data");
      return getMockDashboardData(req, res);
    }

    // Get base dashboard statistics from database
    const baseData = await getBaseDashboardData();

    // Add role-specific data based on user role
    let roleSpecificData = {};

    switch (req.user?.role) {
      case "admin":
        roleSpecificData = await getAdminDashboardData(req.user.id);
        break;
      case "director":
        roleSpecificData = await getDirectorDashboardData(req.user.id);
        break;
      case "front_office":
        roleSpecificData = await getFrontOfficeDashboardData(req.user.id);
        break;
      case "cadet":
        roleSpecificData = await getCadetDashboardData(req.user.id);
        break;
    }

    const dashboardData = {
      ...baseData,
      ...roleSpecificData,
    };

    logger.info(
      `Dashboard data fetched successfully for ${req.user?.role} user: ${req.user?.username}`,
    );

    return res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    logger.error("Error fetching dashboard data from database:", error);

    // Fallback to mock data if database queries fail
    logger.warn("Falling back to mock data due to database error");
    return getMockDashboardData(req, res);
  }
};

// Get base dashboard statistics that apply to all roles
const getBaseDashboardData = async () => {
  try {
    // Case statistics
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

    // Priority statistics
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

    // Case categories
    const caseCategories = await executeQuery(`
            SELECT nature_of_case as name, COUNT(*) as count
            FROM distress_messages
            GROUP BY nature_of_case
            ORDER BY count DESC
            LIMIT 5
        `);

    // Recent cases
    const recentCases = await executeQuery(`
            SELECT
                m.id,
                m.folio_number,
                m.subject,
                m.status,
                m.priority,
                m.created_at,
                m.country_of_origin,
                COALESCE(u.username, 'Unassigned') as assigned_to
            FROM distress_messages m
            LEFT JOIN users u ON m.assigned_to = u.id
            ORDER BY m.created_at DESC
            LIMIT 10
        `);

    return {
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
        folio_number: c.folio_number,
        subject: c.subject,
        status: c.status,
        priority: c.priority,
        createdAt: c.created_at,
        assignedTo: c.assigned_to,
        country_of_origin: c.country_of_origin,
      })),
    };
  } catch (error) {
    logger.error("Error fetching base dashboard data:", error);
    throw error;
  }
};

// Get admin-specific dashboard data
const getAdminDashboardData = async (adminId) => {
  try {
    // User statistics by role
    const userStats = await executeQuery(`
            SELECT 
                role,
                COUNT(*) as total,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
            FROM users
            GROUP BY role
        `);

    // Recent user activities
    const recentUsers = await executeQuery(`
            SELECT 
                id, username, email, role, is_active, 
                last_login, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 10
        `);

    // System audit logs (if available)
    const recentAuditLogs = await executeQuery(`
            SELECT 
                al.action_type,
                al.entity_type,
                al.created_at,
                u.username as performed_by
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT 20
        `).catch(() => []); // Table might not exist yet

    return {
      adminStats: {
        totalUsers: userStats.reduce(
          (sum, stat) => sum + parseInt(stat.total),
          0,
        ),
        activeUsers: userStats.reduce(
          (sum, stat) => sum + parseInt(stat.active),
          0,
        ),
        usersByRole: userStats.reduce((acc, stat) => {
          acc[stat.role] = {
            total: parseInt(stat.total),
            active: parseInt(stat.active),
          };
          return acc;
        }, {}),
      },
      recentUsers: recentUsers,
      recentAuditLogs: recentAuditLogs,
    };
  } catch (error) {
    logger.error("Error fetching admin dashboard data:", error);
    throw error;
  }
};

// Get director-specific dashboard data
const getDirectorDashboardData = async (directorId) => {
  try {
    // Team statistics
    const teamStats = await executeQuery(`
            SELECT 
                COUNT(CASE WHEN role IN ('front_office', 'cadet') THEN 1 END) as total_team_members,
                COUNT(CASE WHEN role = 'front_office' THEN 1 END) as front_office_staff,
                COUNT(CASE WHEN role = 'cadet' THEN 1 END) as cadets
            FROM users
            WHERE is_active = 1
        `);

    // Active case assignments
    const activeCases = await executeQuery(`
            SELECT COUNT(*) as active_cases
            FROM distress_messages
            WHERE status IN ('assigned', 'in_progress')
        `);

    // Pending assignments (unassigned cases)
    const pendingAssignments = await executeQuery(`
            SELECT COUNT(*) as pending_assignments
            FROM distress_messages
            WHERE assigned_to IS NULL AND status = 'pending'
        `);

    // Team workload
    const teamWorkload = await executeQuery(`
            SELECT 
                u.id,
                u.username as member,
                u.role,
                COUNT(dm.id) as active_cases,
                AVG(CASE WHEN dm.first_response_at IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, dm.created_at, dm.first_response_at)
                    ELSE NULL END) as avg_response_time,
                (COUNT(CASE WHEN dm.status = 'resolved' THEN 1 END) * 100.0 / 
                 NULLIF(COUNT(dm.id), 0)) as performance
            FROM users u
            LEFT JOIN distress_messages dm ON u.id = dm.assigned_to
            WHERE u.role IN ('front_office', 'cadet') AND u.is_active = 1
            GROUP BY u.id, u.username, u.role
            ORDER BY u.role, active_cases DESC
        `);

    // Case assignments with details
    const caseAssignments = await executeQuery(
      `
            SELECT 
                ca.id,
                ca.distress_message_id as case_id,
                dm.folio_number as folio,
                dm.subject,
                u.username as assigned_to,
                dm.priority,
                ca.status,
                ca.assignment_date as assigned_date,
                ca.director_instructions as instructions
            FROM case_assignments ca
            JOIN distress_messages dm ON ca.distress_message_id = dm.id
            JOIN users u ON ca.assigned_to = u.id
            WHERE ca.assigned_by = ? AND ca.status = 'active'
            ORDER BY ca.assignment_date DESC
            LIMIT 20
        `,
      [directorId],
    );

    // Urgent alerts
    const urgentAlerts = await executeQuery(`
            SELECT 
                dm.id,
                dm.folio_number,
                dm.subject,
                dm.priority,
                dm.created_at,
                'pending_case' as type,
                CONCAT('Urgent case ', dm.folio_number, ' requires immediate assignment') as message
            FROM distress_messages dm
            WHERE dm.priority = 'urgent' AND dm.assigned_to IS NULL
            UNION ALL
            SELECT 
                dm.id,
                dm.folio_number,
                dm.subject,
                dm.priority,
                dm.created_at,
                'overdue_report' as type,
                CONCAT('Case ', dm.folio_number, ' - No updates in 24 hours') as message
            FROM distress_messages dm
            LEFT JOIN case_updates cu ON dm.id = cu.distress_message_id
            WHERE dm.status IN ('assigned', 'in_progress') 
                AND (cu.created_at IS NULL OR cu.created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR))
            ORDER BY created_at DESC
            LIMIT 10
        `);

    return {
      directorStats: {
        totalTeamMembers: parseInt(teamStats[0]?.total_team_members || 0),
        frontOfficeStaff: parseInt(teamStats[0]?.front_office_staff || 0),
        cadets: parseInt(teamStats[0]?.cadets || 0),
        activeCases: parseInt(activeCases[0]?.active_cases || 0),
        pendingAssignments: parseInt(
          pendingAssignments[0]?.pending_assignments || 0,
        ),
        teamPerformance: Math.round(
          teamWorkload.reduce(
            (sum, member) => sum + (parseFloat(member.performance) || 0),
            0,
          ) / Math.max(teamWorkload.length, 1),
        ),
      },
      teamWorkload: teamWorkload.map((member) => ({
        member: member.member,
        role: member.role,
        activeCases: parseInt(member.active_cases || 0),
        avgResponseTime: Math.round(member.avg_response_time || 0),
        performance: Math.round(member.performance || 0),
      })),
      caseAssignments: caseAssignments,
      urgentAlerts: urgentAlerts.map((alert) => ({
        id: alert.id,
        type: alert.type,
        title:
          alert.type === "pending_case"
            ? "Unassigned Urgent Case"
            : "Overdue Case Update",
        message: alert.message,
        priority: alert.priority,
        createdAt: alert.created_at,
      })),
    };
  } catch (error) {
    logger.error("Error fetching director dashboard data:", error);
    throw error;
  }
};

// Get front office-specific dashboard data
const getFrontOfficeDashboardData = async (userId) => {
  try {
    // Front office statistics
    const frontOfficeStats = await executeQuery(
      `
            SELECT 
                COUNT(CASE WHEN created_by = ? THEN 1 END) as cases_created,
                COUNT(CASE WHEN assigned_to = ? THEN 1 END) as cases_assigned,
                COUNT(CASE WHEN assigned_to = ? AND status IN ('pending', 'assigned') THEN 1 END) as pending_reports,
                AVG(CASE WHEN assigned_to = ? AND first_response_at IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, created_at, first_response_at)
                    ELSE NULL END) as avg_response_time,
                COUNT(CASE WHEN assigned_to = ? AND status = 'resolved' THEN 1 END) * 100.0 /
                NULLIF(COUNT(CASE WHEN assigned_to = ? THEN 1 END), 0) as case_resolution_rate,
                COUNT(CASE WHEN assigned_to = ? AND priority = 'urgent' THEN 1 END) as urgent_cases
            FROM distress_messages
        `,
      [userId, userId, userId, userId, userId, userId, userId],
    );

    // My assigned cases
    const myCases = await executeQuery(
      `
            SELECT 
                dm.id,
                dm.folio_number,
                dm.subject,
                dm.status,
                dm.priority,
                dm.country_of_origin,
                dm.distressed_person_name,
                dm.created_at,
                ca.assignment_date as assigned_date,
                ca.director_instructions,
                (SELECT created_at FROM case_updates WHERE distress_message_id = dm.id ORDER BY created_at DESC LIMIT 1) as last_update,
                dm.resolved_at
            FROM distress_messages dm
            LEFT JOIN case_assignments ca ON dm.id = ca.distress_message_id
            WHERE dm.assigned_to = ?
            ORDER BY 
                CASE dm.priority 
                    WHEN 'urgent' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    ELSE 4 
                END,
                dm.created_at DESC
        `,
      [userId],
    );

    // Recent case updates
    const recentUpdates = await executeQuery(
      `
            SELECT 
                cu.id,
                cu.distress_message_id as case_id,
                dm.folio_number,
                cu.update_text,
                cu.created_at as updated_at,
                u.username as updated_by
            FROM case_updates cu
            JOIN distress_messages dm ON cu.distress_message_id = dm.id
            JOIN users u ON cu.updated_by = u.id
            WHERE dm.assigned_to = ?
            ORDER BY cu.created_at DESC
            LIMIT 10
        `,
      [userId],
    );

    // Performance metrics
    const performanceMetrics = await executeQuery(
      `
            SELECT 
                COUNT(CASE WHEN WEEK(created_at) = WEEK(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 END) as this_week_cases,
                AVG(CASE WHEN WEEK(created_at) = WEEK(NOW()) AND YEAR(created_at) = YEAR(NOW()) AND first_response_at IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, created_at, first_response_at)
                    ELSE NULL END) as this_week_response_time,
                COUNT(CASE WHEN WEEK(resolved_at) = WEEK(NOW()) AND YEAR(resolved_at) = YEAR(NOW()) THEN 1 END) * 100.0 /
                NULLIF(COUNT(CASE WHEN WEEK(created_at) = WEEK(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 END), 0) as this_week_resolution_rate,
                
                COUNT(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 END) as this_month_cases,
                AVG(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) AND first_response_at IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, created_at, first_response_at)
                    ELSE NULL END) as this_month_response_time,
                COUNT(CASE WHEN MONTH(resolved_at) = MONTH(NOW()) AND YEAR(resolved_at) = YEAR(NOW()) THEN 1 END) * 100.0 /
                NULLIF(COUNT(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 END), 0) as this_month_resolution_rate
            FROM distress_messages
            WHERE assigned_to = ?
        `,
      [userId],
    );

    const stats = frontOfficeStats[0] || {};
    const metrics = performanceMetrics[0] || {};

    return {
      frontOfficeStats: {
        casesCreated: parseInt(stats.cases_created || 0),
        casesAssigned: parseInt(stats.cases_assigned || 0),
        pendingReports: parseInt(stats.pending_reports || 0),
        avgResponseTime: Math.round(stats.avg_response_time || 0),
        caseResolutionRate: Math.round(stats.case_resolution_rate || 0),
        urgentCases: parseInt(stats.urgent_cases || 0),
      },
      myCases: myCases,
      recentUpdates: recentUpdates,
      performanceMetrics: {
        thisWeek: {
          casesHandled: parseInt(metrics.this_week_cases || 0),
          avgResponseTime:
            Math.round(metrics.this_week_response_time || 0) + " min",
          resolutionRate:
            Math.round(metrics.this_week_resolution_rate || 0) + "%",
          satisfaction: "4.7/5", // This would come from a separate feedback system
        },
        thisMonth: {
          casesHandled: parseInt(metrics.this_month_cases || 0),
          avgResponseTime:
            Math.round(metrics.this_month_response_time || 0) + " min",
          resolutionRate:
            Math.round(metrics.this_month_resolution_rate || 0) + "%",
          satisfaction: "4.6/5", // This would come from a separate feedback system
        },
      },
      casesByStatus: {
        pending: myCases.filter((c) => c.status === "pending").length,
        assigned: myCases.filter((c) => c.status === "assigned").length,
        in_progress: myCases.filter((c) => c.status === "in_progress").length,
        resolved: myCases.filter((c) => c.status === "resolved").length,
      },
    };
  } catch (error) {
    logger.error("Error fetching front office dashboard data:", error);
    throw error;
  }
};

// Get cadet-specific dashboard data
const getCadetDashboardData = async (userId) => {
  try {
    // Cadet statistics
    const cadetStats = await executeQuery(
      `
            SELECT 
                COUNT(CASE WHEN assigned_to = ? THEN 1 END) as assigned_cases,
                COUNT(CASE WHEN assigned_to = ? AND status = 'resolved' THEN 1 END) as completed_cases,
                AVG(CASE WHEN assigned_to = ? AND first_response_at IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, created_at, first_response_at)
                    ELSE NULL END) as avg_response_time,
                COUNT(CASE WHEN assigned_to = ? AND status = 'resolved' THEN 1 END) * 100.0 /
                NULLIF(COUNT(CASE WHEN assigned_to = ? THEN 1 END), 0) as completion_rate
            FROM distress_messages
        `,
      [userId, userId, userId, userId, userId],
    );

    // My assigned cases
    const myCases = await executeQuery(
      `
            SELECT 
                dm.id,
                dm.folio_number,
                dm.subject,
                dm.status,
                dm.priority,
                dm.country_of_origin,
                dm.distressed_person_name,
                dm.created_at,
                ca.assignment_date as assigned_date,
                ca.director_instructions,
                (SELECT created_at FROM case_updates WHERE distress_message_id = dm.id ORDER BY created_at DESC LIMIT 1) as last_update,
                dm.resolved_at,
                dm.resolution_notes
            FROM distress_messages dm
            LEFT JOIN case_assignments ca ON dm.id = ca.distress_message_id
            WHERE dm.assigned_to = ?
            ORDER BY 
                CASE dm.status
                    WHEN 'assigned' THEN 1
                    WHEN 'in_progress' THEN 2
                    WHEN 'resolved' THEN 3
                    ELSE 4
                END,
                dm.created_at DESC
        `,
      [userId],
    );

    // Performance metrics
    const performanceMetrics = await executeQuery(
      `
            SELECT 
                AVG(CASE WHEN assigned_to = ? AND first_response_at IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, created_at, first_response_at)
                    ELSE NULL END) as avg_response_time,
                COUNT(CASE WHEN assigned_to = ? AND status = 'resolved' THEN 1 END) * 100.0 /
                NULLIF(COUNT(CASE WHEN assigned_to = ? THEN 1 END), 0) as completion_rate,
                
                -- Quality score based on case resolution time vs target
                AVG(CASE 
                    WHEN assigned_to = ? AND status = 'resolved' AND resolved_at IS NOT NULL THEN
                        CASE 
                            WHEN TIMESTAMPDIFF(HOUR, created_at, resolved_at) <= 4 THEN 100
                            WHEN TIMESTAMPDIFF(HOUR, created_at, resolved_at) <= 8 THEN 90
                            WHEN TIMESTAMPDIFF(HOUR, created_at, resolved_at) <= 24 THEN 80
                            ELSE 70
                        END
                    ELSE NULL 
                END) as quality_score
            FROM distress_messages
        `,
      [userId, userId, userId, userId],
    );

    // Recent feedback (would typically come from supervisor reviews)
    const recentFeedback = await executeQuery(
      `
            SELECT 
                'Case Performance Review' as title,
                CONCAT('Performance on case ', dm.folio_number, ' - ', dm.subject) as comment,
                CASE 
                    WHEN TIMESTAMPDIFF(HOUR, dm.created_at, dm.resolved_at) <= 4 THEN 'Excellent'
                    WHEN TIMESTAMPDIFF(HOUR, dm.created_at, dm.resolved_at) <= 8 THEN 'Good'
                    ELSE 'Satisfactory'
                END as rating,
                u.username as reviewer,
                dm.resolved_at as date,
                dm.id as case_id
            FROM distress_messages dm
            LEFT JOIN users u ON u.role = 'director' AND u.is_active = 1
            WHERE dm.assigned_to = ? AND dm.status = 'resolved'
            ORDER BY dm.resolved_at DESC
            LIMIT 5
        `,
      [userId],
    );

    // Supervisor messages (from notifications system)
    const supervisorMessages = await executeQuery(
      `
            SELECT 
                n.id,
                n.title as subject,
                LEFT(n.message, 100) as preview,
                u.username as sender,
                n.created_at as date,
                n.read_at IS NULL as unread,
                CASE n.type
                    WHEN 'assignment' THEN 'High'
                    WHEN 'urgent' THEN 'High'
                    ELSE 'Medium'
                END as priority
            FROM notifications n
            LEFT JOIN users u ON u.role IN ('director', 'admin') AND u.is_active = 1
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
            LIMIT 10
        `,
      [userId],
    );

    const stats = cadetStats[0] || {};
    const metrics = performanceMetrics[0] || {};

    return {
      cadetStats: {
        assignedCases: parseInt(stats.assigned_cases || 0),
        completedCases: parseInt(stats.completed_cases || 0),
        trainingProgress: 75, // This would come from a training tracking system
        performanceScore: Math.round(metrics.quality_score || 88),
        certifications: 4, // This would come from a certification tracking system
        recentAchievements:
          stats.completed_cases > 5
            ? [
                "Completed 5+ cases successfully",
                "Excellent response time average",
              ]
            : [],
      },
      myCases: myCases,
      performanceMetrics: {
        avgResponseTime: Math.round(metrics.avg_response_time || 0),
        responseTimeRating:
          metrics.avg_response_time <= 30
            ? "Excellent"
            : metrics.avg_response_time <= 45
              ? "Good"
              : "Needs Improvement",
        completionRate: Math.round(metrics.completion_rate || 0),
        completionRating:
          metrics.completion_rate >= 90
            ? "Excellent"
            : metrics.completion_rate >= 75
              ? "Good"
              : "Satisfactory",
        qualityScore: Math.round(metrics.quality_score || 0),
        qualityRating:
          metrics.quality_score >= 90
            ? "High"
            : metrics.quality_score >= 75
              ? "Good"
              : "Average",
        trainingParticipation: 85, // This would come from training system
        trainingRating: "Active",
      },
      recentFeedback: recentFeedback,
      supervisorMessages: supervisorMessages,
      // Mock training data - in production this would come from a training management system
      trainingModules: [
        {
          id: 1,
          title: "Emergency Response Fundamentals",
          description: "Basic emergency response procedures and protocols",
          progress: 100,
          completed: true,
          locked: false,
        },
        {
          id: 2,
          title: "Maritime Safety Procedures",
          description:
            "Advanced maritime emergency response and safety protocols",
          progress: 90,
          completed: false,
          locked: false,
        },
        {
          id: 3,
          title: "Crisis Communication",
          description: "Effective communication during crisis situations",
          progress: 45,
          completed: false,
          locked: false,
        },
        {
          id: 4,
          title: "Advanced Search and Rescue",
          description:
            "Specialized search and rescue techniques and coordination",
          progress: 0,
          completed: false,
          locked: true,
        },
      ],
      skillsTracking: [
        {
          id: 1,
          name: "Emergency Response",
          level: 3,
          progressToNext: 75,
          status: "Proficient",
        },
        {
          id: 2,
          name: "Communication",
          level: 2,
          progressToNext: 60,
          status: "Developing",
        },
        {
          id: 3,
          name: "Case Documentation",
          level: 4,
          progressToNext: 20,
          status: "Expert",
        },
        {
          id: 4,
          name: "Team Coordination",
          level: 2,
          progressToNext: 40,
          status: "Developing",
        },
      ],
      certifications: [
        {
          id: 1,
          name: "Emergency Response Level 1",
          earned: true,
          earnedDate: "2024-01-05T00:00:00Z",
          progress: 100,
        },
        {
          id: 2,
          name: "Emergency Response Level 2",
          earned: true,
          earnedDate: "2024-01-12T00:00:00Z",
          progress: 100,
        },
        {
          id: 3,
          name: "Maritime Safety Specialist",
          earned: true,
          earnedDate: "2024-01-10T00:00:00Z",
          progress: 100,
        },
        {
          id: 4,
          name: "Crisis Communication Expert",
          earned: false,
          earnedDate: null,
          progress: 65,
        },
        {
          id: 5,
          name: "Search and Rescue Coordinator",
          earned: false,
          earnedDate: null,
          progress: 25,
        },
        {
          id: 6,
          name: "Team Leadership Certificate",
          earned: true,
          earnedDate: "2024-01-08T00:00:00Z",
          progress: 100,
        },
      ],
      developmentGoals: [
        {
          id: 1,
          title: "Complete Crisis Communication Training",
          description:
            "Finish the crisis communication module to improve coordination skills",
          progress: 65,
          targetDate: "2024-02-15T00:00:00Z",
          completed: false,
        },
        {
          id: 2,
          title: "Achieve Response Time Under 25 Minutes",
          description: "Improve case response time to under 25 minutes average",
          progress:
            metrics.avg_response_time <= 25
              ? 100
              : Math.max(0, 100 - (metrics.avg_response_time - 25) * 2),
          targetDate: "2024-02-01T00:00:00Z",
          completed: metrics.avg_response_time <= 25,
        },
      ],
    };
  } catch (error) {
    logger.error("Error fetching cadet dashboard data:", error);
    throw error;
  }
};

// Fallback to mock data when database is not available
const getMockDashboardData = (req, res) => {
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
    fallback: true, // Indicate this is fallback data
  });
};
