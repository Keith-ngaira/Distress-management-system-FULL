import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Avatar,
  Tooltip,
  Stack,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Business as DirectorIcon,
  Contacts as FrontOfficeIcon,
  School as CadetIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
} from "@mui/icons-material";
import { users as usersApi } from "../../services/api";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogMode, setDialogMode] = useState("create"); // 'create', 'edit', 'view'
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "",
    is_active: true,
  });

  // Mock data for demonstration
  const mockUsers = [
    {
      id: 1,
      username: "admin",
      email: "admin@example.com",
      role: "admin",
      is_active: true,
      last_login: "2024-06-19T10:30:00Z",
      created_at: "2024-01-15T08:00:00Z",
    },
    {
      id: 2,
      username: "director1",
      email: "director1@example.com",
      role: "director",
      is_active: true,
      last_login: "2024-06-19T09:15:00Z",
      created_at: "2024-02-01T10:00:00Z",
    },
    {
      id: 3,
      username: "frontoffice1",
      email: "frontoffice1@example.com",
      role: "front_office",
      is_active: true,
      last_login: "2024-06-19T08:45:00Z",
      created_at: "2024-02-15T09:00:00Z",
    },
    {
      id: 4,
      username: "cadet1",
      email: "cadet1@example.com",
      role: "cadet",
      is_active: false,
      last_login: "2024-06-18T16:30:00Z",
      created_at: "2024-03-01T11:00:00Z",
    },
    {
      id: 5,
      username: "director2",
      email: "director2@example.com",
      role: "director",
      is_active: true,
      last_login: "2024-06-19T07:20:00Z",
      created_at: "2024-03-15T14:00:00Z",
    },
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // Try to fetch from API, fallback to mock data
        try {
          const response = await usersApi.getAll();
          setUsers(response.data || []);
        } catch (apiError) {
          console.log("API not available, using mock data");
          setUsers(mockUsers);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch users");
        setUsers(mockUsers); // Fallback to mock data
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <AdminIcon />;
      case "director":
        return <DirectorIcon />;
      case "front_office":
        return <FrontOfficeIcon />;
      case "cadet":
        return <CadetIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "error";
      case "director":
        return "warning";
      case "front_office":
        return "info";
      case "cadet":
        return "success";
      default:
        return "default";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleOpenDialog = (mode, user = null) => {
    setDialogMode(mode);
    setSelectedUser(user);
    setFormData(
      user
        ? {
            username: user.username,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
          }
        : {
            username: "",
            email: "",
            role: "",
            is_active: true,
          },
    );
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData({
      username: "",
      email: "",
      role: "",
      is_active: true,
    });
  };

  const handleSave = async () => {
    try {
      if (dialogMode === "create") {
        // Create new user logic
        console.log("Creating user:", formData);
      } else if (dialogMode === "edit") {
        // Update user logic
        console.log("Updating user:", selectedUser.id, formData);
      }
      handleCloseDialog();
      // Refresh users list here
    } catch (err) {
      setError(err.message || "Failed to save user");
    }
  };

  const handleToggleStatus = (userId) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, is_active: !user.is_active } : user,
      ),
    );
  };

  const userStats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    inactive: users.filter((u) => !u.is_active).length,
    admins: users.filter((u) => u.role === "admin").length,
    directors: users.filter((u) => u.role === "director").length,
    frontOffice: users.filter((u) => u.role === "front_office").length,
    cadets: users.filter((u) => u.role === "cadet").length,
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4" fontWeight="bold">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog("create")}
        >
          Add New User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {userStats.total}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: "success.main", mr: 2 }}>
                  <ActiveIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {userStats.active}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: "error.main", mr: 2 }}>
                  <AdminIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {userStats.admins}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Administrators
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: "warning.main", mr: 2 }}>
                  <DirectorIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {userStats.directors}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Directors
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Users Table */}
      <Paper sx={{ overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>User</strong>
                </TableCell>
                <TableCell>
                  <strong>Role</strong>
                </TableCell>
                <TableCell>
                  <strong>Status</strong>
                </TableCell>
                <TableCell>
                  <strong>Last Login</strong>
                </TableCell>
                <TableCell>
                  <strong>Created</strong>
                </TableCell>
                <TableCell>
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar
                        sx={{
                          mr: 2,
                          bgcolor: getRoleColor(user.role) + ".main",
                        }}
                      >
                        {getRoleIcon(user.role)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {user.username}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role.replace("_", " ")}
                      color={getRoleColor(user.role)}
                      size="small"
                      icon={getRoleIcon(user.role)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? "Active" : "Inactive"}
                      color={user.is_active ? "success" : "error"}
                      size="small"
                      icon={user.is_active ? <ActiveIcon /> : <BlockIcon />}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.last_login ? formatDate(user.last_login) : "Never"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(user.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog("view", user)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit User">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleOpenDialog("edit", user)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={user.is_active ? "Deactivate" : "Activate"}
                      >
                        <IconButton
                          size="small"
                          color={user.is_active ? "error" : "success"}
                          onClick={() => handleToggleStatus(user.id)}
                        >
                          {user.is_active ? <BlockIcon /> : <ActiveIcon />}
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

      {/* User Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "create" && "Add New User"}
          {dialogMode === "edit" && "Edit User"}
          {dialogMode === "view" && "User Details"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              disabled={dialogMode === "view"}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={dialogMode === "view"}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Role"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              disabled={dialogMode === "view"}
              sx={{ mb: 2 }}
            >
              <MenuItem value="admin">Administrator</MenuItem>
              <MenuItem value="director">Director</MenuItem>
              <MenuItem value="front_office">Front Office</MenuItem>
              <MenuItem value="cadet">Cadet</MenuItem>
            </TextField>
            <TextField
              fullWidth
              select
              label="Status"
              value={formData.is_active}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  is_active: e.target.value === "true",
                })
              }
              disabled={dialogMode === "view"}
            >
              <MenuItem value={true}>Active</MenuItem>
              <MenuItem value={false}>Inactive</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === "view" ? "Close" : "Cancel"}
          </Button>
          {dialogMode !== "view" && (
            <Button onClick={handleSave} variant="contained">
              {dialogMode === "create" ? "Create User" : "Save Changes"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
