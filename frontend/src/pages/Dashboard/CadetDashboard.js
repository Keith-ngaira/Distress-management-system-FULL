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
  LinearProgress,
  Divider,
  Badge,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  School as TrainingIcon,
  TrendingUp as PerformanceIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  Book as BookIcon,
  Quiz as QuizIcon,
  Verified as CertificateIcon,
  Notifications as NotificationIcon,
  Update as UpdateIcon,
  Send as SendIcon,
  Visibility as ViewIcon,
  TaskAlt as TaskIcon,
  Psychology as SkillIcon,
  Timeline as ProgressIcon,
  Grade as GradeIcon,
  EmojiEvents as AchievementIcon,
} from "@mui/icons-material";
import { dashboard } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { format } from "date-fns";

const CadetDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [updateText, setUpdateText] = useState("");
  const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await dashboard.getDashboardData();
        setData(dashboardData);
      } catch (err) {
        setError(err.message || "Failed to fetch cadet dashboard data");
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

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
    progress,
  }) => (
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
            {progress !== undefined && (
              <Box sx={{ mt: 1 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="caption" color="textSecondary">
                  {progress}% Complete
                </Typography>
              </Box>
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
      id={`cadet-tabpanel-${index}`}
      aria-labelledby={`cadet-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  const handleUpdateCase = (caseItem) => {
    setSelectedCase(caseItem);
    setUpdateDialogOpen(true);
  };

  const handleSubmitUpdate = () => {
    // In a real application, this would call the API to submit the update
    console.log(
      "Submitting update for case:",
      selectedCase?.id,
      "Update:",
      updateText,
    );
    setUpdateDialogOpen(false);
    setUpdateText("");
    setSelectedCase(null);
  };

  const handleStartTraining = (training) => {
    setSelectedTraining(training);
    setTrainingDialogOpen(true);
  };

  const handleViewCaseDetails = (caseItem) => {
    // In a real application, this would navigate to the case details page
    console.log("Viewing case details:", caseItem);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.username}!
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Cadet Training & Development Center
      </Typography>

      {/* Main Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Assigned Cases"
            value={data?.cadetStats?.assignedCases || 0}
            icon={AssignmentIcon}
            color={theme.palette.primary.main}
            subtitle="Active assignments"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Training Progress"
            value={`${data?.cadetStats?.trainingProgress || 0}%`}
            icon={TrainingIcon}
            color={theme.palette.success.main}
            subtitle="Overall completion"
            progress={data?.cadetStats?.trainingProgress || 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Performance Score"
            value={`${data?.cadetStats?.performanceScore || 0}%`}
            icon={PerformanceIcon}
            color={theme.palette.warning.main}
            subtitle="Current rating"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Certifications"
            value={data?.cadetStats?.certifications || 0}
            icon={CertificateIcon}
            color={theme.palette.info.main}
            subtitle="Earned certificates"
          />
        </Grid>
      </Grid>

      {/* Achievements Banner */}
      {data?.cadetStats?.recentAchievements?.length > 0 && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<AchievementIcon />}>
          <Typography variant="h6">Recent Achievements!</Typography>
          {data.cadetStats.recentAchievements.map((achievement, index) => (
            <Typography key={index} variant="body2">
              🎉 {achievement}
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
          <Tab icon={<AssignmentIcon />} label="My Cases" />
          <Tab icon={<TrainingIcon />} label="Training & Learning" />
          <Tab icon={<PerformanceIcon />} label="Performance & Progress" />
          <Tab icon={<MessageIcon />} label="Communications" />
        </Tabs>

        {/* My Cases Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              My Assigned Cases
            </Typography>

            {data?.myCases?.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Folio</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Assigned Date</TableCell>
                      <TableCell>Director Instructions</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.myCases.map((caseItem) => (
                      <TableRow key={caseItem.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {caseItem.folio_number}
                          </Typography>
                        </TableCell>
                        <TableCell>{caseItem.subject}</TableCell>
                        <TableCell>
                          <Chip
                            label={caseItem.status}
                            color={
                              caseItem.status === "completed"
                                ? "success"
                                : caseItem.status === "in_progress"
                                  ? "warning"
                                  : caseItem.status === "assigned"
                                    ? "info"
                                    : "default"
                            }
                            size="small"
                          />
                        </TableCell>
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
                            new Date(caseItem.assigned_date),
                            "MMM dd, yyyy",
                          )}
                        </TableCell>
                        <TableCell>
                          <Tooltip title={caseItem.director_instructions}>
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{ maxWidth: 200 }}
                            >
                              {caseItem.director_instructions}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleViewCaseDetails(caseItem)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateCase(caseItem)}
                            color="info"
                            disabled={caseItem.status === "completed"}
                          >
                            <UpdateIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No cases assigned yet. Check back later for new assignments.
              </Alert>
            )}

            {/* Quick Actions */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    sx={{
                      p: 2,
                      textAlign: "center",
                      cursor: "pointer",
                      "&:hover": { elevation: 4 },
                    }}
                  >
                    <TaskIcon
                      sx={{
                        fontSize: 40,
                        color: theme.palette.primary.main,
                        mb: 1,
                      }}
                    />
                    <Typography variant="h6">Case Updates</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Submit progress updates
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    sx={{
                      p: 2,
                      textAlign: "center",
                      cursor: "pointer",
                      "&:hover": { elevation: 4 },
                    }}
                  >
                    <NotificationIcon
                      sx={{
                        fontSize: 40,
                        color: theme.palette.warning.main,
                        mb: 1,
                      }}
                    />
                    <Typography variant="h6">Emergency Protocol</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Access emergency procedures
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    sx={{
                      p: 2,
                      textAlign: "center",
                      cursor: "pointer",
                      "&:hover": { elevation: 4 },
                    }}
                  >
                    <PersonIcon
                      sx={{
                        fontSize: 40,
                        color: theme.palette.info.main,
                        mb: 1,
                      }}
                    />
                    <Typography variant="h6">Request Assistance</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Contact supervisor for help
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </TabPanel>

        {/* Training & Learning Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Training Modules & Learning Resources
            </Typography>

            <Grid container spacing={3}>
              {/* Current Training Modules */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <BookIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                    Current Training Modules
                  </Typography>
                  <List>
                    {data?.trainingModules?.map((module) => (
                      <ListItem key={module.id} divider>
                        <ListItemIcon>
                          {module.completed ? (
                            <CompletedIcon color="success" />
                          ) : (
                            <PendingIcon color="warning" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={module.title}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                {module.description}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={module.progress}
                                sx={{ mt: 1 }}
                              />
                              <Typography variant="caption">
                                {module.progress}% Complete
                              </Typography>
                            </Box>
                          }
                        />
                        <Button
                          variant={module.completed ? "outlined" : "contained"}
                          size="small"
                          onClick={() => handleStartTraining(module)}
                          disabled={module.locked}
                        >
                          {module.completed ? "Review" : "Continue"}
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* Skills Development */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <SkillIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                    Skills Development
                  </Typography>
                  <List>
                    {data?.skillsTracking?.map((skill) => (
                      <ListItem key={skill.id} divider>
                        <ListItemIcon>
                          <Badge badgeContent={skill.level} color="primary">
                            <StarIcon color="warning" />
                          </Badge>
                        </ListItemIcon>
                        <ListItemText
                          primary={skill.name}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                Level {skill.level} - {skill.status}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={skill.progressToNext}
                                sx={{ mt: 1 }}
                              />
                              <Typography variant="caption">
                                {skill.progressToNext}% to next level
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* Certifications & Achievements */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    <CertificateIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                    Certifications & Achievements
                  </Typography>
                  <Grid container spacing={2}>
                    {data?.certifications?.map((cert) => (
                      <Grid item xs={12} sm={6} md={4} key={cert.id}>
                        <Card sx={{ p: 2, textAlign: "center" }}>
                          <GradeIcon
                            sx={{
                              fontSize: 40,
                              color: cert.earned
                                ? theme.palette.success.main
                                : theme.palette.grey[400],
                              mb: 1,
                            }}
                          />
                          <Typography variant="h6">{cert.name}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {cert.description}
                          </Typography>
                          {cert.earned ? (
                            <Chip
                              label={`Earned ${format(new Date(cert.earnedDate), "MMM yyyy")}`}
                              color="success"
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          ) : (
                            <Chip
                              label={`${cert.progress}% Progress`}
                              color="default"
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Performance & Progress Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance Analytics & Personal Development
            </Typography>

            <Grid container spacing={3}>
              {/* Performance Metrics */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <ProgressIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                    Performance Metrics
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Case Response Time"
                        secondary={`Average: ${data?.performanceMetrics?.avgResponseTime || "N/A"} minutes`}
                      />
                      <Chip
                        label={
                          data?.performanceMetrics?.responseTimeRating || "Good"
                        }
                        color="success"
                        size="small"
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Case Completion Rate"
                        secondary={`${data?.performanceMetrics?.completionRate || 0}% of assigned cases completed`}
                      />
                      <Chip
                        label={
                          data?.performanceMetrics?.completionRating ||
                          "Excellent"
                        }
                        color="success"
                        size="small"
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Quality Score"
                        secondary={`Based on supervisor feedback and case outcomes`}
                      />
                      <Chip
                        label={`${data?.performanceMetrics?.qualityScore || 0}%`}
                        color="info"
                        size="small"
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Training Participation"
                        secondary={`${data?.performanceMetrics?.trainingParticipation || 0}% completion rate`}
                      />
                      <Chip
                        label={
                          data?.performanceMetrics?.trainingRating || "Active"
                        }
                        color="primary"
                        size="small"
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              {/* Development Goals */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <TaskIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                    Development Goals
                  </Typography>
                  <List>
                    {data?.developmentGoals?.map((goal) => (
                      <ListItem key={goal.id} divider>
                        <ListItemIcon>
                          {goal.completed ? (
                            <CompletedIcon color="success" />
                          ) : (
                            <WarningIcon color="warning" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={goal.title}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                {goal.description}
                              </Typography>
                              <Typography variant="caption">
                                Target:{" "}
                                {format(
                                  new Date(goal.targetDate),
                                  "MMM dd, yyyy",
                                )}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={goal.progress}
                                sx={{ mt: 1 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* Recent Feedback */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    <MessageIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                    Recent Feedback & Reviews
                  </Typography>
                  {data?.recentFeedback?.length > 0 ? (
                    <List>
                      {data.recentFeedback.map((feedback) => (
                        <ListItem key={feedback.id} divider>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="subtitle1">
                                  {feedback.title}
                                </Typography>
                                <Chip
                                  label={feedback.rating}
                                  color={
                                    feedback.rating === "Excellent"
                                      ? "success"
                                      : feedback.rating === "Good"
                                        ? "info"
                                        : "warning"
                                  }
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  {feedback.comment}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                >
                                  From: {feedback.reviewer} •{" "}
                                  {format(
                                    new Date(feedback.date),
                                    "MMM dd, yyyy",
                                  )}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info">
                      No feedback available yet. Complete assigned cases to
                      receive feedback from supervisors.
                    </Alert>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Communications Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Communications & Support
            </Typography>

            <Grid container spacing={3}>
              {/* Messages from Supervisors */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Messages from Supervisors
                  </Typography>
                  {data?.supervisorMessages?.length > 0 ? (
                    <List>
                      {data.supervisorMessages.map((message) => (
                        <ListItem key={message.id} divider>
                          <ListItemIcon>
                            <Badge
                              variant="dot"
                              color={message.read ? "default" : "primary"}
                            >
                              <MessageIcon />
                            </Badge>
                          </ListItemIcon>
                          <ListItemText
                            primary={message.subject}
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  {message.preview}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                >
                                  From: {message.sender} •{" "}
                                  {format(
                                    new Date(message.date),
                                    "MMM dd, HH:mm",
                                  )}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info">No messages from supervisors.</Alert>
                  )}
                </Paper>
              </Grid>

              {/* Emergency Contacts & Resources */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Emergency Contacts & Resources
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Direct Supervisor"
                        secondary="Contact for immediate assistance with cases"
                      />
                      <Button variant="outlined" size="small">
                        Contact
                      </Button>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Emergency Protocols"
                        secondary="Access critical emergency procedures"
                      />
                      <Button variant="outlined" size="small">
                        View
                      </Button>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <BookIcon color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Training Resources"
                        secondary="Additional learning materials and guides"
                      />
                      <Button variant="outlined" size="small">
                        Access
                      </Button>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <NotificationIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="System Notifications"
                        secondary="Important system updates and announcements"
                      />
                      <Button variant="outlined" size="small">
                        View All
                      </Button>
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Case Update Dialog */}
      <Dialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Update Case Progress - {selectedCase?.folio_number}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Case: {selectedCase?.subject}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Progress Update"
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            placeholder="Describe the progress made on this case..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitUpdate}
            variant="contained"
            startIcon={<SendIcon />}
            disabled={!updateText.trim()}
          >
            Submit Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Training Dialog */}
      <Dialog
        open={trainingDialogOpen}
        onClose={() => setTrainingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Training Module: {selectedTraining?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {selectedTraining?.description}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Progress: {selectedTraining?.progress}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={selectedTraining?.progress || 0}
              sx={{ mt: 1, mb: 2 }}
            />
          </Box>
          {selectedTraining?.completed && (
            <Alert severity="success">
              This training module has been completed!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrainingDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={
              selectedTraining?.completed ? <QuizIcon /> : <BookIcon />
            }
          >
            {selectedTraining?.completed ? "Take Quiz" : "Start Learning"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CadetDashboard;
