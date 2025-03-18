import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    TextField,
    CircularProgress,
    Alert,
    Grid,
    Card,
    CardContent,
    Stack
} from '@mui/material';
import { distressMessages } from '../../services/api';

const DistressMessageDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchMessage = async () => {
            if (!id) return;
            try {
                const data = await distressMessages.getById(parseInt(id, 10));
                setMessage(data);
                setResolutionNotes(data.resolution_notes || '');
                setLoading(false);
            } catch (err) {
                console.error('Error fetching message:', err);
                setError('Failed to load message details');
                setLoading(false);
            }
        };

        fetchMessage();
    }, [id]);

    const handleUpdateResolution = async () => {
        if (!id || !message) return;
        
        try {
            setSaving(true);
            await distressMessages.update(parseInt(id, 10), {
                resolution_notes: resolutionNotes
            });
            setMessage(prev => ({
                ...prev,
                resolution_notes: resolutionNotes
            }));
            setError(null);
        } catch (err) {
            console.error('Error updating resolution:', err);
            setError('Failed to update resolution notes');
        } finally {
            setSaving(false);
        }
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
            <Box p={4}>
                <Alert severity="error">
                    {error}
                </Alert>
            </Box>
        );
    }

    if (!message) {
        return (
            <Box p={4}>
                <Alert severity="info">
                    Message not found
                </Alert>
            </Box>
        );
    }

    return (
        <Box p={6}>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={4}
            >
                <Typography variant="h4" component="h1">
                    Distress Message Details
                </Typography>
                <Button
                    variant="outlined"
                    onClick={() => navigate('/messages')}
                >
                    Back to List
                </Button>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Stack spacing={3}>
                                <Typography variant="h6">Message Information</Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Subject
                                        </Typography>
                                        <Typography>{message.subject}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Status
                                        </Typography>
                                        <Typography>{message.status}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Sender Name
                                        </Typography>
                                        <Typography>{message.sender_name}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Country of Origin
                                        </Typography>
                                        <Typography>{message.country_of_origin}</Typography>
                                    </Grid>
                                </Grid>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Distressed Person
                                    </Typography>
                                    <Typography>{message.distressed_person_name}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Case Details
                                    </Typography>
                                    <Typography
                                        sx={{
                                            whiteSpace: 'pre-wrap',
                                            mt: 1
                                        }}
                                    >
                                        {message.case_details}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Stack spacing={3}>
                        <Card>
                            <CardContent>
                                <Stack spacing={3}>
                                    <Typography variant="h6">Resolution Notes</Typography>
                                    <TextField
                                        value={resolutionNotes}
                                        onChange={(e) => setResolutionNotes(e.target.value)}
                                        placeholder="Enter resolution notes..."
                                        multiline
                                        rows={4}
                                        fullWidth
                                    />
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleUpdateResolution}
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : 'Update Resolution Notes'}
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DistressMessageDetail;
