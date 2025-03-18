import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PropTypes from 'prop-types';

// Define role-based permissions
const rolePermissions = {
    admin: {
        dashboard: ['view_dashboard', 'view_statistics'],
        distress_messages: ['create', 'read', 'update', 'delete', 'assign'],
        users: ['manage', 'read'],
        profile: ['view', 'update']
    },
    director: {
        dashboard: ['view_dashboard', 'view_statistics'],
        distress_messages: ['read', 'update', 'assign'],
        users: ['read'],
        profile: ['view', 'update']
    },
    front_office: {
        dashboard: ['view_dashboard', 'view_statistics'],
        distress_messages: ['create', 'read', 'update'],
        profile: ['view', 'update']
    },
    cadet: {
        dashboard: ['view_dashboard'],
        distress_messages: ['read', 'update'],
        profile: ['view', 'update']
    }
};

const hasPermission = (role, resource, action) => {
    // If no specific permission check is required, allow access
    if (!resource || !action) {
        return true;
    }

    // Check if role exists and has permissions for the resource
    if (!rolePermissions[role] || !rolePermissions[role][resource]) {
        return false;
    }

    return rolePermissions[role][resource].includes(action);
};

const PermissionRoute = ({ children, resource, action, actions = [] }) => {
    const { user, token, isLoading } = useAuth();
    const location = useLocation();

    // Show loading state while checking authentication
    if (isLoading) {
        return <div>Loading...</div>;
    }

    // Redirect to login if not authenticated
    if (!token || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Allow access to profile for all authenticated users
    if (location.pathname === '/profile') {
        return <>{children}</>;
    }

    // Check single action permission
    if (resource && action && !hasPermission(user.role, resource, action)) {
        return <Navigate to="/" replace />;
    }

    // Check multiple actions permission (any)
    if (resource && actions.length > 0 && !actions.some(act => hasPermission(user.role, resource, act))) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

PermissionRoute.propTypes = {
    children: PropTypes.node.isRequired,
    resource: PropTypes.string,
    action: PropTypes.string,
    actions: PropTypes.arrayOf(PropTypes.string)
};

export default PermissionRoute;
