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
  const [assigneeId, setAssigneeId] = useState("");
  const [instructions, setInstructions] = useState("");
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
        setError(err.message || "Failed to fetch director dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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

  const handleAssignCase = (caseItem) => {
    setSelectedCase(caseItem);
    setAssignDialogOpen(true);
  };

  const handleSubmitAssignment = async () => {
    try {
      await caseAssignments.create({
        distressMessageId: selectedCase.id,
        assignedTo: assigneeId,
        instructions: instructions,
      });
      setAssignDialogOpen(false);
      setSelectedCase(null);
      setAssigneeId("");
      setInstructions("");
      // Refresh data
      window.location.reload();
    } catch (err) {
      console.error("Failed to assign case:", err);
    }
  };

  const getAvailableUsers = () => {
    return users.filter(
      (u) => ["front_office", "cadet"].includes(u.role) && u.is_active,
    );
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Director Command Center
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Welcome back, {user?.username}! Manage assignments and monitor team
        performance.
      </Typography>

      {/* Main Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Team Members"
            value={data?.directorStats?.totalTeamMembers || 0}
            icon={GroupIcon}
            color={theme.palette.primary.main}
            subtitle={`${data?.directorStats?.frontOfficeStaff || 0} Front Office, ${data?.directorStats?.cadets || 0} Cadets`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Cases"
            value={data?.directorStats?.activeCases || 0}
            icon={AssignmentIcon}
            color={theme.palette.warning.main}
            subtitle="Currently assigned"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Assignments"
            value={data?.directorStats?.pendingAssignments || 0}
            icon={ScheduleIcon}
            color={theme.palette.error.main}
            subtitle="Awaiting assignment"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Team Performance"
            value={`${data?.directorStats?.teamPerformance || 0}%`}
            icon={TrendingUpIcon}
            color={theme.palette.success.main}
            subtitle="Overall rating"
          />
        </Grid>
      </Grid>

      {/* Urgent Alerts */}
      {data?.urgentAlerts?.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Urgent Attention Required
          </Typography>
          {data.urgentAlerts.map((alert, index) => (
            <Typography key={index} variant="body2">
              • {alert.message}
            </Typography>
          ))}
        </Alert>
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
          <Tab icon={<AssignIcon />} label="Case Assignments" />
          <Tab icon={<GroupIcon />} label="Team Workload" />
          <Tab icon={<PriorityIcon />} label="Priority Cases" />
          <Tab icon={<PerformanceIcon />} label="Performance" />
        </Tabs>

        {/* Case Assignments Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Case Assignment Management
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Folio</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Assigned Date</TableCell>
                    <TableCell>Instructions</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.caseAssignments?.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {assignment.folio}
                        </Typography>
                      </TableCell>
                      <TableCell>{assignment.subject}</TableCell>
                      <TableCell>{assignment.assignedTo}</TableCell>
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
                        {format(
                          new Date(assignment.assignedDate),
                          "MMM dd, HH:mm",
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={assignment.instructions}>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ maxWidth: 200 }}
                          >
                            {assignment.instructions}
                          </Typography>
                        </Tooltip>
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

            {/* Unassigned Cases */}
            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
              Unassigned Cases Requiring Assignment
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Folio</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.recentCases
                    ?.filter((c) => c.assignedTo === "Unassigned")
                    .map((caseItem) => (
                      <TableRow key={caseItem.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {caseItem.folio_number}
                          </Typography>
                        </TableCell>
                        <TableCell>{caseItem.subject}</TableCell>
                        <TableCell>
                          <Chip
                            label={caseItem.priority}
                            color={
                              caseItem.priority === "urgent"
                                ? "error"
                                : caseItem.priority === "high"
                                  ? "warning"
                                  : "default"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(caseItem.createdAt),
                            "MMM dd, HH:mm",
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleAssignCase(caseItem)}
                            color="primary"
                          >
                            Assign
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Team Workload Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Team Workload Distribution
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Team Member</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Active Cases</TableCell>
                    <TableCell>Avg Response Time</TableCell>
                    <TableCell>Performance</TableCell>
                    <TableCell>Workload</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.teamWorkload?.map((member) => (
                    <TableRow key={member.member}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar
                            sx={{ mr: 2, bgcolor: theme.palette.primary.main }}
                          >
                            <PersonIcon />
                          </Avatar>
                          <Typography variant="body2">
                            {member.member}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.role.replace("_", " ")}
                          color={
                            member.role === "front_office" ? "info" : "success"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{member.activeCases}</TableCell>
                      <TableCell>{member.avgResponseTime} min</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {member.performance}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={member.performance}
                            sx={{ width: 60 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            member.activeCases > 3
                              ? "High"
                              : member.activeCases > 1
                                ? "Medium"
                                : "Low"
                          }
                          color={
                            member.activeCases > 3
                              ? "error"
                              : member.activeCases > 1
                                ? "warning"
                                : "success"
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Priority Cases Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Priority Case Management
            </Typography>

            <Grid container spacing={3}>
              {data?.priorityStats?.map((priority) => (
                <Grid item xs={12} md={6} key={priority.priority}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {priority.priority.toUpperCase()} Priority Cases
                      </Typography>
                      <Typography
                        variant="h3"
                        color={
                          priority.priority === "urgent"
                            ? theme.palette.error.main
                            : priority.priority === "high"
                              ? theme.palette.warning.main
                              : theme.palette.info.main
                        }
                      >
                        {priority.count}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Avg. First Response: {priority.avgFirstResponse} minutes
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Team Performance Analytics
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Overall Team Statistics
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Cases Resolved This Week"
                          secondary={`${data?.stats?.resolved || 0} cases completed`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <TrendingUpIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Average Response Time"
                          secondary={`${data?.stats?.avgFirstResponse || 0} minutes`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <AssignmentIcon color="info" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Active Assignments"
                          secondary={`${data?.stats?.assigned || 0} cases currently assigned`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Department Overview
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <SupportIcon color="info" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Front Office Staff"
                          secondary={`${data?.directorStats?.frontOfficeStaff || 0} active personnel`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Cadets in Training"
                          secondary={`${data?.directorStats?.cadets || 0} trainees`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <EngineeringIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Overdue Reports"
                          secondary={`${data?.directorStats?.overdueReports || 0} pending review`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Assignment Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Assign Case: {selectedCase?.subject}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Folio: {selectedCase?.folio_number} | Priority:{" "}
            {selectedCase?.priority}
          </Typography>

          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Assign To</InputLabel>
            <Select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              label="Assign To"
            >
              {getAvailableUsers().map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.username} ({user.role.replace("_", " ")})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Instructions for Assignee"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Provide specific instructions for handling this case..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitAssignment}
            variant="contained"
            disabled={!assigneeId}
          >
            Assign Case
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DirectorDashboard;
