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
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Tabs,
  Tab,
} from "@mui/material";
import {
  WarningAmber as AlertIcon,
  CheckCircle as ResolvedIcon,
  Pending as PendingIcon,
  Assignment as AssignedIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  AccessTime as TimeIcon,
  Notifications as NotificationIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Engineering as EngineeringIcon,
  Support as SupportIcon,
} from "@mui/icons-material";
import { dashboard, users as usersApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { format } from "date-fns";
import DirectorDashboard from "./DirectorDashboard";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardData, usersData] = await Promise.all([
          dashboard.getDashboardData(),
          user?.role === "admin" ? usersApi.getAll() : Promise.resolve([]),
        ]);
        setData(dashboardData);
        setUsers(usersData);
      } catch (err) {
        setError(err.message || "Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.role]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card
      sx={{ height: "100%", cursor: "pointer", "&:hover": { elevation: 8 } }}
    >
      <CardContent>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Box>
            <Typography variant="h6" component="div" color="textSecondary">
              {title}
            </Typography>
            <Typography
              variant="h3"
              component="div"
              color={color}
              fontWeight="bold"
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            <Icon sx={{ fontSize: 30 }} />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const getUserRoleStats = () => {
    const roleStats = users.reduce((acc, user) => {
      if (!acc[user.role]) {
        acc[user.role] = { total: 0, active: 0 };
      }
      acc[user.role].total++;
      if (user.is_active) {
        acc[user.role].active++;
      }
      return acc;
    }, {});

    return [
      {
        role: "admin",
        ...roleStats.admin,
        icon: AdminIcon,
        color: theme.palette.error.main,
      },
      {
        role: "director",
        ...roleStats.director,
        icon: EngineeringIcon,
        color: theme.palette.warning.main,
      },
      {
        role: "front_office",
        ...roleStats.front_office,
        icon: SupportIcon,
        color: theme.palette.info.main,
      },
      {
        role: "cadet",
        ...roleStats.cadet,
        icon: PersonIcon,
        color: theme.palette.success.main,
      },
    ].filter((stat) => stat.total > 0);
  };

  const getRecentUsers = () => {
    return users
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  // Show director-specific dashboard for directors
  if (user?.role === "director") {
    return <DirectorDashboard />;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.username}!
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        {user?.role === "admin"
          ? "System Administrator Dashboard"
          : "Dashboard Overview"}
      </Typography>

      {/* Main Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="New Cases"
            value={data?.stats?.pending || 0}
            icon={AlertIcon}
            color={theme.palette.error.main}
            subtitle="Pending attention"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Assigned Cases"
            value={data?.stats?.assigned || 0}
            icon={AssignedIcon}
            color={theme.palette.info.main}
            subtitle="Currently assigned"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Cases"
            value={data?.stats?.active || 0}
            icon={PendingIcon}
            color={theme.palette.warning.main}
            subtitle="In progress"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Resolved Cases"
            value={data?.stats?.resolved || 0}
            icon={ResolvedIcon}
            color={theme.palette.success.main}
            subtitle="Successfully completed"
          />
        </Grid>
      </Grid>

      {/* Admin User Statistics */}
      {user?.role === "admin" && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {getUserRoleStats().map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat.role}>
              <StatCard
                title={stat.role.replace("_", " ").toUpperCase()}
                value={stat.total || 0}
                icon={stat.icon}
                color={stat.color}
                subtitle={`${stat.active || 0} active users`}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tabbed Content */}
      <Paper sx={{ width: "100%" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<TrendingUpIcon />} label="Performance" />
          <Tab icon={<NotificationIcon />} label="Recent Activity" />
          {user?.role === "admin" && (
            <Tab icon={<GroupIcon />} label="User Overview" />
          )}
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3} sx={{ p: 3 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <TimeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Average Response Time"
                    secondary={`${data?.stats?.avgFirstResponse || 0} minutes`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUpIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Average Resolution Time"
                    secondary={`${data?.stats?.avgResolutionTime || 0} hours`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ResolvedIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Total Cases Handled"
                    secondary={`${data?.stats?.total || 0} cases`}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Priority Distribution
              </Typography>
              {data?.priorityStats?.map((priority, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body1">
                      {priority.priority.toUpperCase()}
                    </Typography>
                    <Chip
                      label={priority.count}
                      color={
                        priority.priority === "urgent"
                          ? "error"
                          : priority.priority === "high"
                            ? "warning"
                            : priority.priority === "medium"
                              ? "info"
                              : "default"
                      }
                      size="small"
                    />
                  </Box>
                </Box>
              ))}
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Cases
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.recentCases?.map((case_, index) => (
                    <TableRow key={case_.id || index}>
                      <TableCell>{case_.subject}</TableCell>
                      <TableCell>
                        <Chip
                          label={case_.status}
                          color={
                            case_.status === "resolved"
                              ? "success"
                              : case_.status === "in_progress"
                                ? "warning"
                                : case_.status === "assigned"
                                  ? "info"
                                  : "default"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={case_.priority}
                          color={
                            case_.priority === "urgent"
                              ? "error"
                              : case_.priority === "high"
                                ? "warning"
                                : "default"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{case_.assignedTo || "Unassigned"}</TableCell>
                      <TableCell>
                        {case_.createdAt
                          ? format(new Date(case_.createdAt), "MMM dd, HH:mm")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {user?.role === "admin" && (
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Users
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getRecentUsers().map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.role.replace("_", " ")}
                            color={
                              user.role === "admin"
                                ? "error"
                                : user.role === "director"
                                  ? "warning"
                                  : user.role === "front_office"
                                    ? "info"
                                    : "success"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_active ? "Active" : "Inactive"}
                            color={user.is_active ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {user.last_login
                            ? format(new Date(user.last_login), "MMM dd, HH:mm")
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), "MMM dd, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>
        )}
      </Paper>
    </Box>
  );
};

export default Dashboard;
