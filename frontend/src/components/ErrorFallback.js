import React from 'react';
import {
    Box,
    Typography,
    Button,
    Stack,
    Paper,
    useTheme
} from '@mui/material';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
    const theme = useTheme();

    return (
        <Box
            minHeight="100vh"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bgcolor={theme.palette.background.default}
            p={4}
        >
            <Stack
                component={Paper}
                elevation={3}
                spacing={3}
                maxWidth="600px"
                textAlign="center"
                p={4}
            >
                <Typography variant="h4" color="error">
                    Oops! Something went wrong
                </Typography>
                <Typography color="text.secondary">
                    We apologize for the inconvenience. An error has occurred in the application.
                </Typography>
                {process.env.NODE_ENV === 'development' && (
                    <Box
                        component="pre"
                        p={2}
                        bgcolor={theme.palette.grey[900]}
                        color={theme.palette.common.white}
                        borderRadius={1}
                        fontSize="0.875rem"
                        maxWidth="100%"
                        overflow="auto"
                        sx={{
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap'
                        }}
                    >
                        {error.message}
                    </Box>
                )}
                <Button
                    variant="contained"
                    color="primary"
                    onClick={resetErrorBoundary}
                    sx={{ alignSelf: 'center' }}
                >
                    Try Again
                </Button>
            </Stack>
        </Box>
    );
};

export default ErrorFallback;
