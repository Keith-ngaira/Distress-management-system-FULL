import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
} from '@mui/material';
import { register } from '../../services/api';

const ROLES = ['cadet', 'front_office', 'director', 'admin'];

const UserManagement = () => {
    const [open, setOpen] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleClickOpen = () => {
        setOpen(true);
        resetForm();
    };

    const handleClose = () => {
        setOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setUsername('');
        setPassword('');
        setRole('');
        setError('');
    };

    const handleCreateUser = async () => {
        try {
            // Validate input
            if (!username || !password || !role) {
                setError('All fields are required');
                return;
            }

            if (password.length < 6) {
                setError('Password must be at least 6 characters long');
                return;
            }

            // Call API to create user
            await register(username, password, role);
            
            setSuccess('User created successfully');
            handleClose();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create user');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                User Management
            </Typography>
            <Paper sx={{ p: 3, mt: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleClickOpen}
                    sx={{ mb: 3 }}
                >
                    Add New User
                </Button>
            </Paper>

            {/* Create User Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Create New User</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            margin="dense"
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="dense"
                        />
                        <FormControl fullWidth margin="dense">
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={role}
                                label="Role"
                                onChange={(e) => setRole(e.target.value)}
                            >
                                {ROLES.map((roleOption) => (
                                    <MenuItem 
                                        key={roleOption} 
                                        value={roleOption}
                                    >
                                        {roleOption.replace('_', ' ').toUpperCase()}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {error && (
                            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                                {error}
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleCreateUser} variant="contained" color="primary">
                        Create User
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Snackbar */}
            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
                    {success}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UserManagement;
