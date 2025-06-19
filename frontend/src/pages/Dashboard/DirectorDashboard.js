import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Engineering as EngineeringIcon,
  Support as SupportIcon,
  Assignment as CaseIcon,
  Speed as PerformanceIcon,
  AssignmentInd as AssignIcon,
  PriorityHigh as PriorityIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import {
  dashboard,
  users as usersApi,
  caseAssignments,
} from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { format } from "date-fns";

const DirectorDashboard = () => {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    assignedTo: "",
    instructions: "",
  });
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardData, usersData] = await Promise.all([
          dashboard.getDashboardData(),
          usersApi.getAll(),
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
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAssignCase = (caseItem) => {
    setSelectedCase(caseItem);
    setAssignDialogOpen(true);
  };

  const handleAssignmentSubmit = async () => {
    try {
      const assignedUser = users.find(
        (u) => u.username === assignmentData.assignedTo,
      );
      if (!assignedUser) {
        setError("Selected user not found");
        return;
      }

      await caseAssignments.create({
        distressMessageId: selectedCase.id,
        assignedTo: assignedUser.id,
        instructions: assignmentData.instructions,
      });

      // Refresh data after assignment
      const updatedData = await dashboard.getDashboardData();
      setData(updatedData);

      setAssignDialogOpen(false);
      setAssignmentData({ assignedTo: "", instructions: "" });
      setSelectedCase(null);
    } catch (err) {
      setError("Failed to assign case: " + (err.message || "Unknown error"));
    }
  };

  const getTeamMembers = () => {
    return users.filter((u) => u.role === "front_office" || u.role === "cadet");
  };

  const getPerformanceColor = (performance) => {
    if (performance >= 90) return theme.palette.success.main;
    if (performance >= 75) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, action }) => (
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
          <Box flex={1}>
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
            {action && <Box mt={1}>{action}</Box>}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            <Icon sx={{ fontSize: 30 }} />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`director-tabpanel-${index}`}
      aria-labelledby={`director-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <Box textAlign="center">
          <Typography variant="h6" gutterBottom>
            Loading Director Dashboard...
          </Typography>
          <LinearProgress sx={{ width: 300 }} />
        </Box>
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

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3}>
        <EngineeringIcon
          sx={{ fontSize: 40, mr: 2, color: theme.palette.warning.main }}
        />
        <Box>
          <Typography variant="h4" gutterBottom>
            Director Command Center
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Welcome back, {user?.username} - Manage operations and coordinate
            response efforts
          </Typography>
        </Box>
      </Box>

      {/* Urgent Alerts */}
      {data?.urgentAlerts && data.urgentAlerts.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom color="error">
            🚨 Urgent Alerts Requiring Your Attention
          </Typography>
          <Grid container spacing={2}>
            {data.urgentAlerts.map((alert) => (
              <Grid item xs={12} md={6} key={alert.id}>
                <Alert
                  severity={alert.priority === "urgent" ? "error" : "warning"}
                  action={
                    <Button size="small" variant="outlined">
                      Take Action
                    </Button>
                  }
                >
                  <Typography variant="subtitle2">{alert.title}</Typography>
                  <Typography variant="body2">{alert.message}</Typography>
                </Alert>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Main Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Cases"
            value={data?.directorStats?.activeCases || data?.stats?.active || 0}
            icon={CaseIcon}
            color={theme.palette.info.main}
            subtitle="Under your supervision"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Team Members"
            value={
              data?.directorStats?.totalTeamMembers || getTeamMembers().length
            }
            icon={GroupIcon}
            color={theme.palette.success.main}
            subtitle={`${data?.directorStats?.frontOfficeStaff || 0} front office, ${data?.directorStats?.cadets || 0} cadets`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Assignments"
            value={
              data?.directorStats?.pendingAssignments ||
              data?.stats?.pending ||
              0
            }
            icon={AssignmentIcon}
            color={theme.palette.warning.main}
            subtitle="Cases awaiting assignment"
            action={
              <Button size="small" variant="contained" color="warning">
                Assign Now
              </Button>
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Team Performance"
            value={`${data?.directorStats?.teamPerformance || 87}%`}
            icon={PerformanceIcon}
            color={getPerformanceColor(
              data?.directorStats?.teamPerformance || 87,
            )}
            subtitle="Overall team efficiency"
          />
        </Grid>
      </Grid>

      {/* Tabbed Content */}
      <Paper sx={{ width: "100%" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<AssignIcon />} label="Case Assignments" />
          <Tab icon={<GroupIcon />} label="Team Workload" />
          <Tab icon={<PriorityIcon />} label="Priority Cases" />
          <Tab icon={<TrendingUpIcon />} label="Performance Metrics" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Typography variant="h6">Recent Case Assignments</Typography>
              <Button variant="contained" startIcon={<AssignIcon />}>
                New Assignment
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Folio #</TableCell>
                    <TableCell>Case</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Instructions</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.caseAssignments?.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <Chip label={assignment.folio} variant="outlined" />
                      </TableCell>
                      <TableCell>{assignment.subject}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
                            {assignment.assignedTo.charAt(0).toUpperCase()}
                          </Avatar>
                          {assignment.assignedTo}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={assignment.priority}
                          color={
                            assignment.priority === "urgent"
                              ? "error"
                              : assignment.priority === "high"
                                ? "warning"
                                : "default"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={assignment.instructions}>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {assignment.instructions}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={assignment.status}
                          color={
                            assignment.status === "active"
                              ? "success"
                              : "default"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary">
                          <InfoIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Team Workload Distribution
            </Typography>
            <Grid container spacing={3}>
              {data?.teamWorkload?.map((member) => (
                <Grid item xs={12} md={6} lg={4} key={member.member}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar
                          sx={{
                            mr: 2,
                            bgcolor:
                              member.role === "front_office"
                                ? theme.palette.info.main
                                : theme.palette.success.main,
                          }}
                        >
                          {member.role === "front_office" ? (
                            <SupportIcon />
                          ) : (
                            <PersonIcon />
                          )}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1">
                            {member.member}
                          </Typography>
                          <Chip
                            label={member.role.replace("_", " ")}
                            size="small"
                            color={
                              member.role === "front_office"
                                ? "info"
                                : "success"
                            }
                          />
                        </Box>
                      </Box>
                      <Box mb={1}>
                        <Typography variant="body2" color="textSecondary">
                          Active Cases
                        </Typography>
                        <Typography variant="h6">
                          {member.activeCases}
                        </Typography>
                      </Box>
                      <Box mb={1}>
                        <Typography variant="body2" color="textSecondary">
                          Avg Response Time
                        </Typography>
                        <Typography variant="body1">
                          {member.avgResponseTime} min
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Performance
                        </Typography>
                        <Box display="flex" alignItems="center">
                          <LinearProgress
                            variant="determinate"
                            value={member.performance}
                            sx={{
                              flexGrow: 1,
                              mr: 1,
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: getPerformanceColor(
                                  member.performance,
                                ),
                              },
                            }}
                          />
                          <Typography variant="body2">
                            {member.performance}%
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Priority Cases Requiring Attention
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Folio #</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.recentCases
                    ?.filter(
                      (c) => c.priority === "urgent" || c.priority === "high",
                    )
                    .map((case_) => (
                      <TableRow key={case_.id}>
                        <TableCell>
                          <Chip label={case_.folio_number} variant="outlined" />
                        </TableCell>
                        <TableCell>{case_.subject}</TableCell>
                        <TableCell>
                          <Chip
                            label={case_.priority}
                            color={
                              case_.priority === "urgent" ? "error" : "warning"
                            }
                            size="small"
                          />
                        </TableCell>
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
                        <TableCell>{case_.country_of_origin}</TableCell>
                        <TableCell>{case_.assignedTo}</TableCell>
                        <TableCell>
                          {format(new Date(case_.createdAt), "MMM dd, HH:mm")}
                        </TableCell>
                        <TableCell>
                          {case_.assignedTo === "Unassigned" && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<AssignIcon />}
                              onClick={() => handleAssignCase(case_)}
                            >
                              Assign
                            </Button>
                          )}
                          {case_.assignedTo !== "Unassigned" && (
                            <IconButton size="small" color="primary">
                              <InfoIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Response Time Metrics
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <ScheduleIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Average First Response"
                      secondary={`${data?.stats?.avgFirstResponse || 0} minutes`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Average Resolution Time"
                      secondary={`${data?.stats?.avgResolutionTime || 0} hours`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Team Efficiency"
                      secondary={`${data?.directorStats?.teamPerformance || 87}% overall performance`}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Case Distribution by Priority
                </Typography>
                {data?.priorityStats?.map((priority, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
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
                    <LinearProgress
                      variant="determinate"
                      value={(priority.count / data.stats.total) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Case Assignment Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Case: {selectedCase?.subject}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth margin="dense">
              <InputLabel>Assign To</InputLabel>
              <Select
                value={assignmentData.assignedTo}
                label="Assign To"
                onChange={(e) =>
                  setAssignmentData((prev) => ({
                    ...prev,
                    assignedTo: e.target.value,
                  }))
                }
              >
                {getTeamMembers().map((member) => (
                  <MenuItem key={member.id} value={member.username}>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 1, width: 24, height: 24 }}>
                        {member.username.charAt(0).toUpperCase()}
                      </Avatar>
                      {member.username} ({member.role.replace("_", " ")})
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              margin="dense"
              label="Director Instructions"
              multiline
              rows={4}
              value={assignmentData.instructions}
              onChange={(e) =>
                setAssignmentData((prev) => ({
                  ...prev,
                  instructions: e.target.value,
                }))
              }
              placeholder="Provide specific instructions for handling this case..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssignmentSubmit}
            variant="contained"
            color="primary"
            disabled={!assignmentData.assignedTo}
          >
            Assign Case
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DirectorDashboard;
