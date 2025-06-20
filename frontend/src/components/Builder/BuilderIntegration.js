import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Stack,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  CloudSync as SyncIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { builderService } from "../../services/builderService";

const BuilderIntegration = () => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [bulkSyncDialog, setBulkSyncDialog] = useState(false);
  const [bulkSyncResult, setBulkSyncResult] = useState(null);

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await builderService.getSyncStatus();
      setSyncStatus(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setSyncing(true);
      setError(null);
      const response = await builderService.testConnection();
      setSyncStatus((prev) => ({
        ...prev,
        connection: response.data,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleBulkSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      const response = await builderService.bulkSyncDistressMessages();
      setBulkSyncResult(response.data);
      setBulkSyncDialog(false);
      await loadSyncStatus(); // Refresh status
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const getConnectionStatus = () => {
    if (!syncStatus?.connection) return { color: "error", text: "Unknown" };
    if (syncStatus.connection.connected)
      return { color: "success", text: "Connected" };
    return { color: "error", text: "Disconnected" };
  };

  const connectionStatus = getConnectionStatus();

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>
          Loading Builder.io integration status...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Builder.io Integration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Sync your distress management data with Builder.io CMS for content
        management and publishing.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {bulkSyncResult && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setBulkSyncResult(null)}
        >
          Bulk sync completed: {bulkSyncResult.success} successful,{" "}
          {bulkSyncResult.failures} failed out of {bulkSyncResult.total} total
          records.
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Connection Status Card */}
        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography variant="h6">Connection Status</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  icon={
                    connectionStatus.color === "success" ? (
                      <SuccessIcon />
                    ) : (
                      <ErrorIcon />
                    )
                  }
                  label={connectionStatus.text}
                  color={connectionStatus.color}
                  variant="outlined"
                />
                <Tooltip title="Test Connection">
                  <IconButton onClick={testConnection} disabled={syncing}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            {syncStatus?.connection && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  API Configured: {syncStatus.apiConfigured ? "Yes" : "No"}
                </Typography>
                {syncStatus.connection.error && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      {syncStatus.connection.error}
                    </Typography>
                    {syncStatus.connection.hint && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 1 }}
                      >
                        {syncStatus.connection.hint}
                      </Typography>
                    )}
                  </Alert>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Configuration Card */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Model Configuration
            </Typography>
            {syncStatus?.models && (
              <List dense>
                {Object.entries(syncStatus.models).map(([key, value]) => (
                  <ListItem key={key}>
                    <ListItemIcon>
                      <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                      secondary={value}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Sync Actions Card */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sync Actions
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setBulkSyncDialog(true)}
                disabled={syncing || !syncStatus?.connection?.connected}
                fullWidth
              >
                Bulk Sync All Distress Messages
              </Button>
              <Typography variant="caption" color="text.secondary">
                This will sync all distress messages from your database to
                Builder.io. Existing entries will be updated, new entries will
                be created.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Setup Instructions</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography variant="body2">
                To set up Builder.io integration:
              </Typography>
              <Box component="ol" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    Get your private API key from{" "}
                    <a
                      href="https://builder.io/account/space"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Builder.io Account Settings
                    </a>
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    Add your API key to the backend .env file:{" "}
                    <code>BUILDER_API_KEY=your-key-here</code>
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    Create data models in Builder.io for: distress-messages,
                    users, case-updates, notifications
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    Restart the backend server to apply configuration
                  </Typography>
                </Box>
                <Box component="li">
                  <Typography variant="body2">
                    Test the connection using the refresh button above
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>

      {/* Bulk Sync Confirmation Dialog */}
      <Dialog
        open={bulkSyncDialog}
        onClose={() => setBulkSyncDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Bulk Sync</DialogTitle>
        <DialogContent>
          <Typography>
            This will sync all distress messages from your database to
            Builder.io. This operation may take several minutes depending on the
            amount of data.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Are you sure you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkSyncDialog(false)}>Cancel</Button>
          <Button
            onClick={handleBulkSync}
            variant="contained"
            disabled={syncing}
            startIcon={syncing ? <LinearProgress size={20} /> : <SyncIcon />}
          >
            {syncing ? "Syncing..." : "Start Sync"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BuilderIntegration;
