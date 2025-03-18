import React, { useState } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../services/api';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [openDialog, setOpenDialog] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleOpenDialog = () => {
        setOpenDialog(true);
        resetForm();
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        resetForm();
    };

    const resetForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate passwords
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long');
            return;
        }

        try {
            await auth.changePassword({
                currentPassword,
                newPassword
            });
            setSuccess('Password changed successfully');
            handleCloseDialog();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        }
    };

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                Profile
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                User Information
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body1">
                                    <strong>Username:</strong> {user?.username}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Role:</strong> {user?.role?.replace('_', ' ').toUpperCase()}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Email:</strong> {user?.email}
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleOpenDialog}
                            >
                                Change Password
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Change Password Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleChangePassword} sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            label="Current Password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            margin="dense"
                            required
                        />
                        <TextField
                            fullWidth
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            margin="dense"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Confirm New Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            margin="dense"
                            required
                        />
                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleChangePassword} variant="contained" color="primary">
                        Change Password
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Snackbar */}
            {success && (
                <Alert
                    severity="success"
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: (theme) => theme.zIndex.snackbar
                    }}
                    onClose={() => setSuccess('')}
                >
                    {success}
                </Alert>
            )}
        </Box>
    );
};

export default Profile;
