# 🔔 Notification System Documentation

## Overview

The Distress Management System features a comprehensive, real-time notification system that keeps users informed about critical events, case updates, and system activities. The notification system is fully integrated across frontend, backend, and database layers with automatic event triggers and user-friendly interfaces.

## 🏗️ System Architecture

### Database Layer

- **Table**: `notifications`
- **Location**: `backend/src/database/schema.sql`
- **Features**: Optimized indexing, expiration support, reference linking

### Backend Layer

- **Controller**: `backend/src/controllers/notificationController.js`
- **Service**: `backend/src/services/notificationService.js`
- **Routes**: `backend/src/routes/notificationRoutes.js`
- **Integration**: Full authentication and error handling

### Frontend Layer

- **Component**: `frontend/src/components/Notifications/NotificationBell.js`
- **API Integration**: `frontend/src/services/api.js`
- **Location**: Top navigation bar (visible on all dashboards)

## 📊 Database Schema

```sql
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    reference_type VARCHAR(50),
    reference_id INT,
    sound_enabled BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- Optimized indexes for performance
    INDEX idx_user_unread (user_id, read_at),
    INDEX idx_reference (reference_type, reference_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_created_at (created_at)
);
```

## 🔄 Automatic Notification Triggers

### 1. New Case Assignment

- **Trigger**: When a distress message is assigned to a user
- **Type**: `new_case`
- **Recipients**: Assigned user
- **Sound**: ✅ Enabled
- **Data**: Includes distress message ID and details

### 2. Case Status Changes

- **Trigger**: When case status changes (pending → assigned → in_progress → resolved)
- **Type**: `case_update`
- **Recipients**: Assigned user
- **Sound**: ❌ Disabled
- **Data**: Includes new status and case details

### 3. Case Updates/Comments

- **Trigger**: When someone adds updates or comments to a case
- **Type**: `case_update`
- **Recipients**: Assigned user (excludes self-notifications)
- **Sound**: ❌ Disabled
- **Data**: Includes update text and case details

### 4. Case Reassignment

- **Trigger**: When a case is reassigned to a different user
- **Types**: `case_assignment` (new assignee), `case_reassignment` (old assignee)
- **Recipients**: Both old and new assignees
- **Sound**: ✅ Enabled for new assignee
- **Data**: Includes case details and assignment information

### 5. Case Resolution

- **Trigger**: When a case is marked as resolved
- **Type**: `case_resolved`
- **Recipients**: Case creator and assigned user
- **Sound**: ✅ Enabled
- **Data**: Includes resolution details

## 🎯 Frontend Features

### Notification Bell Component

- **Location**: Top navigation bar (`Layout.js`)
- **Visual**: Bell icon with red badge showing unread count
- **Behavior**: Click to open notification dropdown

### Real-time Updates

- **Polling Interval**: 30 seconds
- **Technology**: React Query with automatic refetching
- **Background Updates**: Continuous monitoring while app is active

### User Interface

- **Dropdown Design**: Clean Material-UI popover
- **Notification List**: Scrollable list with titles, messages, and timestamps
- **Timestamps**: Human-readable format using date-fns
- **Empty State**: "No notifications" message when list is empty

### Auto-Read Functionality

- **Trigger**: Opening notification dropdown
- **Action**: Automatically marks all unread notifications as read
- **Visual Feedback**: Badge count updates immediately

## 🔌 API Endpoints

### Get User Notifications

```http
GET /api/notifications
Authorization: Bearer {token}
Query Parameters:
  - page (optional): Page number (default: 1)
  - limit (optional): Items per page (default: 10)
```

**Response:**

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "user_id": 2,
        "type": "new_case",
        "title": "New Case Assigned",
        "message": "A new case has been assigned to you: Emergency Rescue",
        "data": { "distressMessageId": 15 },
        "reference_type": "distress_message",
        "reference_id": 15,
        "sound_enabled": true,
        "read_at": null,
        "created_at": "2024-01-15T10:30:00Z",
        "expires_at": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### Get Unread Count

```http
GET /api/notifications/unread-count
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

### Mark Notification as Read

```http
PUT /api/notifications/:id/read
Authorization: Bearer {token}
```

### Mark All Notifications as Read

```http
PUT /api/notifications/mark-all-read
Authorization: Bearer {token}
```

### Delete Notification

```http
DELETE /api/notifications/:id
Authorization: Bearer {token}
```

## 💻 Frontend Integration

### React Query Setup

```javascript
// Fetch notifications with auto-refresh
const { data: notificationData } = useQuery({
  queryKey: ["notifications"],
  queryFn: notifications.getAll,
  refetchInterval: 30000, // 30 seconds
});

// Fetch unread count
const { data: unreadData } = useQuery({
  queryKey: ["unreadCount"],
  queryFn: notifications.getUnreadCount,
  refetchInterval: 30000,
});
```

### API Service Usage

```javascript
import { notifications } from "../services/api";

// Get all notifications
const notificationList = await notifications.getAll();

// Get unread count
const unreadCount = await notifications.getUnreadCount();

// Mark as read
await notifications.markAsRead(notificationId);

// Mark all as read
await notifications.markAllAsRead();

// Delete notification
await notifications.delete(notificationId);
```

## 🔧 Backend Service Usage

### Creating Notifications Programmatically

```javascript
import NotificationService from "../services/notificationService.js";

// Notify about new case assignment
await NotificationService.notifyNewDistressMessage(
  distressMessage,
  assignedToId,
);

// Notify about status change
await NotificationService.notifyCaseStatusChange(distressMessage, updatedBy);

// Notify about case update
await NotificationService.notifyCaseUpdate(
  distressMessage,
  updateText,
  updatedBy,
);

// Notify about reassignment
await NotificationService.notifyCaseReassignment(
  distressMessage,
  oldAssigneeId,
  newAssigneeId,
);

// Notify about resolution
await NotificationService.notifyCaseResolution(distressMessage, resolvedBy);
```

### Direct Notification Creation

```javascript
import { createNotification } from "../controllers/notificationController.js";

await createNotification(
  userId, // User to notify
  "custom_type", // Notification type
  "Alert Title", // Notification title
  "Alert message", // Notification message
  { key: "value" }, // Additional data (optional)
  "entity_type", // Reference type (optional)
  entityId, // Reference ID (optional)
  true, // Sound enabled (optional)
  expiresAt, // Expiration date (optional)
);
```

## 🎨 Customization Options

### Notification Types

- `new_case` - New case assignments
- `case_update` - Case status or content updates
- `case_assignment` - Case assignments
- `case_reassignment` - Case reassignments
- `case_resolved` - Case resolutions
- `custom_type` - Custom notifications

### Sound Notifications

- Enabled for high-priority events (assignments, resolutions)
- Disabled for routine updates
- Configurable per notification

### Expiration Support

- Set expiration dates for time-sensitive notifications
- Automatic cleanup of expired notifications
- Prevents notification overflow

## 🔍 Monitoring & Debugging

### Development Logging

- Comprehensive logging in `notificationController.js`
- Error tracking and debugging information
- API request/response logging

### Database Monitoring

- Optimized indexes for performance
- Query performance tracking
- Automatic cleanup mechanisms

### Frontend Debugging

- React Query DevTools integration
- Console logging in development mode
- Error boundary protection

## 🚀 Performance Optimization

### Database Level

- Optimized indexes for fast querying
- Efficient pagination support
- Automatic cleanup of old notifications

### Backend Level

- Async/await pattern for non-blocking operations
- Error handling with graceful fallbacks
- Efficient query patterns

### Frontend Level

- React Query caching and background updates
- Optimistic updates for better UX
- Minimal re-renders with proper dependency arrays

## 🔒 Security Features

### Authentication

- All notification endpoints require authentication
- User isolation - users only see their own notifications
- JWT token validation

### Authorization

- Role-based access control
- User-specific notification filtering
- Secure API endpoints

### Data Protection

- SQL injection prevention
- Input validation and sanitization
- Secure error messaging

## 📱 User Experience

### Visual Feedback

- Red badge with unread count
- Smooth animations and transitions
- Clear visual hierarchy

### Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility

### Responsive Design

- Works on all screen sizes
- Touch-friendly interface
- Optimized for mobile devices

## 🎯 Current Status

### ✅ Fully Implemented Features

- Real-time notification delivery
- Automatic event triggers
- User-friendly interface
- Complete API endpoints
- Database integration
- Performance optimization
- Security measures

### ✅ Production Ready

- Comprehensive error handling
- Fallback mechanisms
- Performance monitoring
- Security validation
- User experience optimization

## 📚 Related Documentation

- [Dashboard Functionality Report](DASHBOARD_FUNCTIONALITY_REPORT.md)
- [Database Connectivity Guide](DATABASE_CONNECTIVITY_GUIDE.md)
- [System Users Credentials](SYSTEM_USERS_CREDENTIALS.md)
- [API Documentation](docs/04-api-documentation.md)

## 🤝 Support

For technical support or questions about the notification system:

1. Check the error logs in `backend/logs/`
2. Review the API response status codes
3. Verify database connectivity
4. Check frontend console for JavaScript errors

The notification system is fully functional and ready for production use across all user roles in the Distress Management System.
