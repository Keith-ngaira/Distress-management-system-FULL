import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
} from "@mui/material";
import { distressMessages } from "../../services/api";

const DistressMessageList = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await distressMessages.getAll();
        // Ensure we always have an array
        setMessages(Array.isArray(response) ? response : []);
        setError(null);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setError("Failed to load messages. Please try again later.");
        // Set mock data as fallback when API fails
        setMessages([
          {
            id: 1,
            title: "Maritime Emergency - Vessel Distress",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            title: "Missing Fishing Boat Report",
            status: "RESOLVED",
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 3,
            title: "Oil Spill Alert - Coastal Waters",
            status: "ACTIVE",
            created_at: new Date(Date.now() - 7200000).toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const handleViewDetails = (id) => {
    navigate(`/messages/${id}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={8}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Ensure messages is always an array
  const messageList = Array.isArray(messages) ? messages : [];

  return (
    <Box p={6}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Distress Messages
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate("/messages/create")}
        sx={{ mb: 4 }}
      >
        Create New Message
      </Button>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error} - Showing sample data for demonstration.
        </Alert>
      )}

      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messageList.map((message) => (
              <TableRow key={message.id}>
                <TableCell>{message.id}</TableCell>
                <TableCell>{message.title}</TableCell>
                <TableCell>
                  <Chip
                    label={message.status}
                    color={message.status === "ACTIVE" ? "success" : "default"}
                    size="small"
                    sx={{
                      fontWeight: 500,
                    }}
                  />
                </TableCell>
                <TableCell>
                  {new Date(message.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleViewDetails(message.id.toString())}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DistressMessageList;
