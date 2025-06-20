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
  Fab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from "@mui/material";
import {
  Assignment as CaseIcon,
  Add as AddIcon,
  Update as UpdateIcon,
  Warning as WarningIcon,
  CheckCircle as ResolvedIcon,
  Schedule as PendingIcon,
  Support as SupportIcon,
  TrendingUp as TrendingUpIcon,
  Speed as PerformanceIcon,
  Report as ReportIcon,
  Warning as EmergencyIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
  Info as InfoIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { dashboard, distressMessages } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { format } from "date-fns";

const FrontOfficeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [updateText, setUpdateText] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCaseData, setNewCaseData] = useState({
    sender_name: "",
    subject: "",
    country_of_origin: "",
    distressed_person_name: "",
    nature_of_case: "",
    case_details: "",
    priority: "medium",
  });
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await dashboard.getDashboardData();
        setData(dashboardData);
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

  const handleUpdateCase = (caseItem) => {
    setSelectedCase(caseItem);
    setUpdateDialogOpen(true);
  };

  const handleSubmitUpdate = async () => {
    try {
      await distressMessages.addUpdate(selectedCase.id, {
        update_text: updateText,
      });

      setUpdateDialogOpen(false);
      setUpdateText("");
      setSelectedCase(null);

      // Refresh data
      const updatedData = await dashboard.getDashboardData();
      setData(updatedData);
    } catch (err) {
      setError("Failed to update case: " + (err.message || "Unknown error"));
    }
  };

  const handleCreateCase = () => {
    setCreateDialogOpen(true);
  };

  const handleSubmitNewCase = async () => {
    try {
      await distressMessages.create(newCaseData);

      setCreateDialogOpen(false);
      setNewCaseData({
        sender_name: "",
        subject: "",
        country_of_origin: "",
        distressed_person_name: "",
        nature_of_case: "",
        case_details: "",
        priority: "medium",
      });

      // Refresh data
      const updatedData = await dashboard.getDashboardData();
      setData(updatedData);
    } catch (err) {
      setError("Failed to create case: " + (err.message || "Unknown error"));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "resolved":
        return <ResolvedIcon />;
      case "in_progress":
        return <UpdateIcon />;
      case "assigned":
        return <CaseIcon />;
      default:
        return <PendingIcon />;
    }
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
      id={`frontoffice-tabpanel-${index}`}
      aria-labelledby={`frontoffice-tab-${index}`}
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
            Loading Front Office Dashboard...
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
        <SupportIcon
          sx={{ fontSize: 40, mr: 2, color: theme.palette.info.main }}
        />
        <Box>
          <Typography variant="h4" gutterBottom>
            Front Office Operations Center
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Welcome back, {user?.username} - Manage cases and coordinate
            emergency responses
          </Typography>
        </Box>
      </Box>

      {/* Quick Actions */}
      {data?.quickActions && data.quickActions.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            🚀 Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {data.quickActions.map((action) => (
              <Grid item xs={12} md={4} key={action.id}>
                <Card
                  sx={{
                    cursor: "pointer",
                    "&:hover": { elevation: 6 },
                    border: action.urgent ? 2 : 0,
                    borderColor: action.urgent
                      ? theme.palette.error.main
                      : "transparent",
                  }}
                  onClick={() => {
                    if (action.action === "create_case") handleCreateCase();
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <Avatar
                        sx={{
                          mr: 2,
                          bgcolor: action.urgent
                            ? theme.palette.error.main
                            : theme.palette.primary.main,
                        }}
                      >
                        {action.icon === "add_circle" && <AddIcon />}
                        {action.icon === "warning" && <WarningIcon />}
                        {action.icon === "assignment" && <ReportIcon />}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {action.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {action.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Main Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="My Active Cases"
            value={
              data?.frontOfficeStats?.casesAssigned ||
              data?.casesByStatus?.assigned +
                data?.casesByStatus?.in_progress ||
              3
            }
            icon={CaseIcon}
            color={theme.palette.info.main}
            subtitle="Currently handling"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Cases Created"
            value={data?.frontOfficeStats?.casesCreated || 8}
            icon={AddIcon}
            color={theme.palette.success.main}
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Response Time"
            value={`${data?.frontOfficeStats?.avgResponseTime || 18} min`}
            icon={PerformanceIcon}
            color={theme.palette.warning.main}
            subtitle="Current performance"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Urgent Cases"
            value={data?.frontOfficeStats?.urgentCases || 3}
            icon={EmergencyIcon}
            color={theme.palette.error.main}
            subtitle="Need immediate attention"
            action={
              <Button size="small" variant="contained" color="error">
                View Now
              </Button>
            }
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
          <Tab icon={<CaseIcon />} label="My Cases" />
          <Tab icon={<UpdateIcon />} label="Recent Updates" />
          <Tab icon={<TrendingUpIcon />} label="Performance" />
          <Tab icon={<EmergencyIcon />} label="Emergency Protocols" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Typography variant="h6">My Assigned Cases</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateCase}
              >
                Create New Case
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Folio #</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Person</TableCell>
                    <TableCell>Last Update</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.myCases?.map((case_) => (
                    <TableRow key={case_.id}>
                      <TableCell>
                        <Chip label={case_.folio_number} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {case_.subject}
                        </Typography>
                        {case_.director_instructions && (
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ fontStyle: "italic" }}
                          >
                            "{case_.director_instructions}"
                          </Typography>
                        )}
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
                          icon={getStatusIcon(case_.status)}
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
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <FlagIcon sx={{ mr: 1, fontSize: 16 }} />
                          {case_.country_of_origin}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <PersonIcon sx={{ mr: 1, fontSize: 16 }} />
                          {case_.distressed_person_name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {case_.last_update
                          ? format(new Date(case_.last_update), "MMM dd, HH:mm")
                          : "No updates"}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Add Update">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleUpdateCase(case_)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="info">
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
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
              Recent Case Updates
            </Typography>
            <List>
              {data?.recentUpdates?.map((update) => (
                <ListItem key={update.id} divider>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                      <UpdateIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <Chip
                          label={update.folio_number}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="subtitle2">
                          Updated by {update.updated_by}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {update.update_text}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {format(
                            new Date(update.updated_at),
                            "MMM dd, yyyy HH:mm",
                          )}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  This Week Performance
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CaseIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Cases Handled"
                      secondary={
                        data?.performanceMetrics?.thisWeek?.casesHandled ||
                        "5 cases"
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <PerformanceIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Average Response Time"
                      secondary={
                        data?.performanceMetrics?.thisWeek?.avgResponseTime ||
                        "18 min"
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <ResolvedIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Resolution Rate"
                      secondary={
                        data?.performanceMetrics?.thisWeek?.resolutionRate ||
                        "92%"
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Satisfaction Score"
                      secondary={
                        data?.performanceMetrics?.thisWeek?.satisfaction ||
                        "4.7/5"
                      }
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Monthly Overview
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Cases Handled Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={75}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption">23/30 cases target</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Response Time Goal
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={85}
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption">Under 25 min target</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Quality Score
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={92}
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption">
                    4.6/5 average rating
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Emergency Response Protocols
            </Typography>
            <Stepper orientation="vertical">
              <Step active>
                <StepLabel>Immediate Assessment</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    • Verify the nature and severity of the emergency • Gather
                    essential contact information • Determine immediate life
                    safety concerns
                  </Typography>
                </StepContent>
              </Step>
              <Step active>
                <StepLabel>Initial Response</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    • Alert appropriate emergency services • Notify
                    supervisor/director immediately • Document all initial
                    information in the system
                  </Typography>
                </StepContent>
              </Step>
              <Step active>
                <StepLabel>Coordination</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    • Coordinate with local authorities • Maintain communication
                    with all parties • Provide regular updates to management
                  </Typography>
                </StepContent>
              </Step>
              <Step active>
                <StepLabel>Follow-up</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    • Monitor progress and outcomes • Complete detailed incident
                    reports • Conduct post-incident review if required
                  </Typography>
                </StepContent>
              </Step>
            </Stepper>

            <Box mt={3}>
              <Alert severity="info">
                <Typography variant="subtitle2">Emergency Contacts</Typography>
                <Typography variant="body2">
                  Director Hotline: +1-555-EMERGENCY
                  <br />
                  Coast Guard: +1-555-COAST-GUARD
                  <br />
                  Medical Emergency: +1-555-MEDICAL
                </Typography>
              </Alert>
            </Box>
          </Box>
        </TabPanel>
      </Paper>

      {/* Floating Action Button for Quick Case Creation */}
      <Fab
        color="primary"
        aria-label="create case"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={handleCreateCase}
      >
        <AddIcon />
      </Fab>

      {/* Case Update Dialog */}
      <Dialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Update Case: {selectedCase?.folio_number}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedCase?.subject}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Person: {selectedCase?.distressed_person_name} | Country:{" "}
              {selectedCase?.country_of_origin}
            </Typography>
            {selectedCase?.director_instructions && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">
                  Director Instructions:
                </Typography>
                <Typography variant="body2">
                  {selectedCase.director_instructions}
                </Typography>
              </Alert>
            )}
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Case Update"
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              placeholder="Provide details about the current status, actions taken, or next steps..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitUpdate}
            variant="contained"
            color="primary"
            disabled={!updateText.trim()}
          >
            Submit Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create New Case Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Distress Case</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sender Name"
                  value={newCaseData.sender_name}
                  onChange={(e) =>
                    setNewCaseData((prev) => ({
                      ...prev,
                      sender_name: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Country of Origin"
                  value={newCaseData.country_of_origin}
                  onChange={(e) =>
                    setNewCaseData((prev) => ({
                      ...prev,
                      country_of_origin: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject"
                  value={newCaseData.subject}
                  onChange={(e) =>
                    setNewCaseData((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Distressed Person Name"
                  value={newCaseData.distressed_person_name}
                  onChange={(e) =>
                    setNewCaseData((prev) => ({
                      ...prev,
                      distressed_person_name: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={newCaseData.priority}
                    label="Priority"
                    onChange={(e) =>
                      setNewCaseData((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nature of Case"
                  value={newCaseData.nature_of_case}
                  onChange={(e) =>
                    setNewCaseData((prev) => ({
                      ...prev,
                      nature_of_case: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Case Details"
                  value={newCaseData.case_details}
                  onChange={(e) =>
                    setNewCaseData((prev) => ({
                      ...prev,
                      case_details: e.target.value,
                    }))
                  }
                  placeholder="Provide detailed information about the emergency situation..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitNewCase}
            variant="contained"
            color="primary"
            disabled={
              !newCaseData.sender_name ||
              !newCaseData.subject ||
              !newCaseData.nature_of_case
            }
          >
            Create Case
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FrontOfficeDashboard;
