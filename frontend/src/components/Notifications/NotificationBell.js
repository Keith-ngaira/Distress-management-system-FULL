import React, { useState } from 'react';
import { Badge, IconButton, Popover, List, ListItem, ListItemText, Typography, Box } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { notifications } from '../../services/api';

const NotificationBell = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const queryClient = useQueryClient();

    // Fetch notifications
    const { data: notificationData } = useQuery({
        queryKey: ['notifications'],
        queryFn: notifications.getAll,
        refetchInterval: 30000 // Refetch every 30 seconds
    });

    // Fetch unread count
    const { data: unreadData } = useQuery({
        queryKey: ['unreadCount'],
        queryFn: notifications.getUnreadCount,
        refetchInterval: 30000
    });

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: notifications.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications']);
            queryClient.invalidateQueries(['unreadCount']);
        }
    });

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: notifications.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications']);
            queryClient.invalidateQueries(['unreadCount']);
        }
    });

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
        if (unreadData?.count > 0) {
            markAllAsReadMutation.mutate();
        }
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const unreadCount = unreadData?.count || 0;
    const notificationList = notificationData?.notifications || [];

    return (
        <>
            <IconButton
                color="inherit"
                onClick={handleClick}
                aria-label={`${unreadCount} notifications`}
            >
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <Box sx={{ width: 400, maxHeight: 400, overflow: 'auto' }}>
                    {notificationList.length > 0 ? (
                        <List>
                            {notificationList.map((notification) => (
                                <ListItem key={notification.id} divider>
                                    <ListItemText
                                        primary={notification.title}
                                        secondary={
                                            <>
                                                <Typography variant="body2" color="text.secondary">
                                                    {notification.message}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {format(new Date(notification.created_at), 'PPpp')}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Box p={2}>
                            <Typography variant="body2" color="text.secondary" align="center">
                                No notifications
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Popover>
        </>
    );
};

export default NotificationBell;
