import React from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Grid,
    Alert,
    CircularProgress,
} from '@mui/material';

const DistressMessageForm = ({
    title,
    formData,
    onSubmit,
    onChange,
    onCancel,
    error,
    loading,
    saving,
    submitButtonText,
}) => {
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                {title}
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper elevation={3} sx={{ p: 2 }}>
                <form onSubmit={onSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Subject"
                                name="subject"
                                value={formData.subject}
                                onChange={onChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Sender Name"
                                name="sender_name"
                                value={formData.sender_name}
                                onChange={onChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Country of Origin"
                                name="country_of_origin"
                                value={formData.country_of_origin}
                                onChange={onChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Distressed Person Name"
                                name="distressed_person_name"
                                value={formData.distressed_person_name}
                                onChange={onChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nature of Case"
                                name="nature_of_case"
                                value={formData.nature_of_case}
                                onChange={onChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Case Details"
                                name="case_details"
                                value={formData.case_details}
                                onChange={onChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box display="flex" gap={2}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : submitButtonText}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={onCancel}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

DistressMessageForm.propTypes = {
    title: PropTypes.string.isRequired,
    formData: PropTypes.shape({
        subject: PropTypes.string.isRequired,
        sender_name: PropTypes.string.isRequired,
        country_of_origin: PropTypes.string.isRequired,
        distressed_person_name: PropTypes.string.isRequired,
        nature_of_case: PropTypes.string.isRequired,
        case_details: PropTypes.string.isRequired,
    }).isRequired,
    onSubmit: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    error: PropTypes.string,
    loading: PropTypes.bool,
    saving: PropTypes.bool,
    submitButtonText: PropTypes.string.isRequired,
};

export default DistressMessageForm;
