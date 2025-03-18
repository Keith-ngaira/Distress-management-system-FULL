import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    useTheme
} from '@mui/material';
import {
    WarningAmber as AlertIcon,
    CheckCircle as ResolvedIcon,
    Pending as PendingIcon,
    Assignment as AssignedIcon
} from '@mui/icons-material';
import { dashboard } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const theme = useTheme();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const dashboardData = await dashboard.getDashboardData();
                setData(dashboardData);
            } catch (err) {
                setError(err.message || 'Failed to fetch dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
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

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                    <Icon sx={{ color, mr: 1 }} />
                    <Typography variant="h6" component="div">
                        {title}
                    </Typography>
                </Box>
                <Typography variant="h3" component="div" color={color}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                Welcome back, {user?.username}!
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="New Cases"
                        value={data.newCases}
                        icon={AlertIcon}
                        color={theme.palette.error.main}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Assigned Cases"
                        value={data.assignedCases}
                        icon={AssignedIcon}
                        color={theme.palette.info.main}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Pending Cases"
                        value={data.pendingCases}
                        icon={PendingIcon}
                        color={theme.palette.warning.main}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Resolved Cases"
                        value={data.resolvedCases}
                        icon={ResolvedIcon}
                        color={theme.palette.success.main}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Activity
                        </Typography>
                        {data.recentActivity.map((activity, index) => (
                            <Box key={index} sx={{ mb: 2 }}>
                                <Typography variant="subtitle1">
                                    {activity.title}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {activity.timestamp}
                                </Typography>
                            </Box>
                        ))}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Performance Metrics
                        </Typography>
                        <Box>
                            <Typography variant="subtitle1">
                                Average Response Time: {data.metrics.avgResponseTime}
                            </Typography>
                            <Typography variant="subtitle1">
                                Resolution Rate: {data.metrics.resolutionRate}%
                            </Typography>
                            <Typography variant="subtitle1">
                                User Satisfaction: {data.metrics.satisfaction}%
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
