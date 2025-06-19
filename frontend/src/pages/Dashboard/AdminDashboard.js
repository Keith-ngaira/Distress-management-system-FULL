import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  useTheme,
  Badge,
  Stack,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Notifications as NotificationsIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import {
  dashboard,
  distressMessages,
  users as usersApi,
} from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [recentMessages, setRecentMessages] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);

        // Fetch multiple data sources in parallel
        const [dashboardResponse, messagesResponse] = await Promise.allSettled([
          dashboard.getDashboardData(),
          distressMessages.getAll({
            limit: 10,
            sortBy: "created_at",
            sortOrder: "desc",
          }),
        ]);

        // Handle dashboard data
        if (dashboardResponse.status === "fulfilled") {
          setDashboardData(dashboardResponse.value);
        } else {
          // Mock data for demonstration
          setDashboardData({
            totalCases: 156,
            newCases: 12,
            assignedCases: 34,
            pendingCases: 23,
            resolvedCases: 87,
            urgentCases: 5,
            avgResponseTime: "2.4 hours",
            resolutionRate: 89,
            userSatisfaction: 94,
          });
        }

        // Handle messages data
        if (messagesResponse.status === "fulfilled") {
          setRecentMessages(messagesResponse.value.data || []);
        } else {
          // Mock recent messages
          setRecentMessages([
            {
              id: 1,
              folio_number: "DM2024001",
              sender_name: "Emergency Response Unit",
              subject: "Maritime Distress - Vessel Adrift",
              priority: "urgent",
              status: "pending",
              created_at: new Date().toISOString(),
              country_of_origin: "Kenya",
            },
            {
              id: 2,
              folio_number: "DM2024002",
              sender_name: "Coast Guard Station",
              subject: "Missing Fishing Vessel",
              priority: "high",
              status: "assigned",
              created_at: new Date(Date.now() - 3600000).toISOString(),
              country_of_origin: "Tanzania",
            },
            {
              id: 3,
              folio_number: "DM2024003",
              sender_name: "Port Authority",
              subject: "Oil Spill Report",
              priority: "medium",
              status: "in_progress",
              created_at: new Date(Date.now() - 7200000).toISOString(),
              country_of_origin: "Uganda",
            },
          ]);
        }

        // Mock system metrics
        setSystemMetrics({
          serverUptime: "99.9%",
          activeUsers: 23,
          systemLoad: 45,
          databaseSize: "2.3 GB",
          responseTime: "0.8s",
          errorRate: "0.1%",
        });

        // Mock user statistics
        setUserStats({
          totalUsers: 45,
          activeToday: 12,
          newThisMonth: 5,
          adminUsers: 3,
          directorUsers: 8,
          frontOfficeUsers: 18,
          cadetUsers: 16,
        });
      } catch (err) {
        setError(err.message || "Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    trend,
    trendValue,
  }) => (
    <Card sx={{ height: "100%", position: "relative", overflow: "visible" }}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Box>
            <Typography
              variant="h4"
              component="div"
              color={color}
              fontWeight="bold"
            >
              {value}
            </Typography>
            <Typography variant="h6" component="div" color="textPrimary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            <Icon sx={{ fontSize: 28 }} />
          </Avatar>
        </Box>
        {trend && (
          <Box display="flex" alignItems="center" mt={1}>
            {trend === "up" ? (
              <TrendingUpIcon color="success" />
            ) : (
              <TrendingDownIcon color="error" />
            )}
            <Typography
              variant="body2"
              color={trend === "up" ? "success.main" : "error.main"}
              ml={0.5}
            >
              {trendValue}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return theme.palette.error.main;
      case "high":
        return theme.palette.warning.main;
      case "medium":
        return theme.palette.info.main;
      case "low":
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return theme.palette.warning.main;
      case "assigned":
        return theme.palette.info.main;
      case "in_progress":
        return theme.palette.primary.main;
      case "resolved":
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Admin Dashboard
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Welcome back, {user?.username}! Here's your system overview.
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            color="primary"
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Main Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Cases"
            value={dashboardData?.totalCases || 0}
            subtitle="All time"
            icon={DashboardIcon}
            color={theme.palette.primary.main}
            trend="up"
            trendValue="+12% this month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Urgent Cases"
            value={dashboardData?.urgentCases || 0}
            subtitle="Needs immediate attention"
            icon={WarningIcon}
            color={theme.palette.error.main}
            trend="down"
            trendValue="-5% vs last week"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Resolution Rate"
            value={`${dashboardData?.resolutionRate || 0}%`}
            subtitle="Cases resolved successfully"
            icon={CheckCircleIcon}
            color={theme.palette.success.main}
            trend="up"
            trendValue="+3% improvement"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Response"
            value={dashboardData?.avgResponseTime || "N/A"}
            subtitle="Time to first response"
            icon={SpeedIcon}
            color={theme.palette.info.main}
            trend="up"
            trendValue="15min faster"
          />
        </Grid>
      </Grid>

      {/* Secondary Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Pending"
            value={dashboardData?.pendingCases || 0}
            icon={ScheduleIcon}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Assigned"
            value={dashboardData?.assignedCases || 0}
            icon={AssignmentIcon}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Resolved"
            value={dashboardData?.resolvedCases || 0}
            icon={CheckCircleIcon}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Active Users"
            value={systemMetrics?.activeUsers || 0}
            icon={PersonIcon}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="System Load"
            value={`${systemMetrics?.systemLoad || 0}%`}
            icon={AnalyticsIcon}
            color={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Uptime"
            value={systemMetrics?.serverUptime || "N/A"}
            icon={SecurityIcon}
            color={theme.palette.success.main}
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Recent Distress Messages */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: "fit-content" }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Typography variant="h6" fontWeight="bold">
                Recent Distress Messages
              </Typography>
              <Box>
                <IconButton size="small" sx={{ mr: 1 }}>
                  <FilterIcon />
                </IconButton>
                <Button variant="outlined" size="small" startIcon={<AddIcon />}>
                  New Case
                </Button>
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Folio Number</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Subject</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Priority</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Country</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentMessages.map((message) => (
                    <TableRow key={message.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {message.folio_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {message.subject}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          from {message.sender_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={message.priority}
                          size="small"
                          sx={{
                            bgcolor: getPriorityColor(message.priority),
                            color: "white",
                            textTransform: "uppercase",
                            fontWeight: "bold",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={message.status}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: getStatusColor(message.status),
                            color: getStatusColor(message.status),
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {message.country_of_origin}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Details">
                            <IconButton size="small" color="primary">
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="secondary">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* System Status & User Activity */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* System Health */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                System Health
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.success.main,
                        width: 32,
                        height: 32,
                      }}
                    >
                      <SecurityIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Server Uptime"
                    secondary={systemMetrics?.serverUptime}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.info.main,
                        width: 32,
                        height: 32,
                      }}
                    >
                      <SpeedIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Response Time"
                    secondary={systemMetrics?.responseTime}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.warning.main,
                        width: 32,
                        height: 32,
                      }}
                    >
                      <AnalyticsIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="System Load"
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {systemMetrics?.systemLoad}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={systemMetrics?.systemLoad || 0}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              </List>
            </Paper>

            {/* User Statistics */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                User Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {userStats?.totalUsers || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Users
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography
                      variant="h4"
                      color="success.main"
                      fontWeight="bold"
                    >
                      {userStats?.activeToday || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Active Today
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                User Roles Distribution
              </Typography>
              <Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="body2">Admins</Typography>
                  <Chip
                    size="small"
                    label={userStats?.adminUsers || 0}
                    color="error"
                  />
                </Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="body2">Directors</Typography>
                  <Chip
                    size="small"
                    label={userStats?.directorUsers || 0}
                    color="warning"
                  />
                </Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="body2">Front Office</Typography>
                  <Chip
                    size="small"
                    label={userStats?.frontOfficeUsers || 0}
                    color="info"
                  />
                </Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2">Cadets</Typography>
                  <Chip
                    size="small"
                    label={userStats?.cadetUsers || 0}
                    color="success"
                  />
                </Box>
              </Box>
            </Paper>

            {/* Quick Actions */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Quick Actions
              </Typography>
              <Stack spacing={1}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AddIcon />}
                  color="primary"
                >
                  Create New Case
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PersonIcon />}
                  color="secondary"
                >
                  Manage Users
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AnalyticsIcon />}
                  color="info"
                >
                  View Reports
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<SettingsIcon />}
                  color="warning"
                >
                  System Settings
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
