# API Documentation

## Authentication Endpoints

### POST /api/auth/login
Login to the system
```json
{
  "username": "string",
  "password": "string"
}
```

### POST /api/auth/logout
Logout from the system

## Distress Message Endpoints

### GET /api/messages
Get list of distress messages
- Admin/Director: All messages
- Front Office: Created messages
- Cadet: Assigned messages

### POST /api/messages
Create new distress message
```json
{
  "sender_name": "string",
  "reference_number": "string",
  "subject": "string",
  "country_of_origin": "string",
  "distressed_person_name": "string",
  "nature_of_case": "string",
  "case_details": "string"
}
```

### PUT /api/messages/:id
Update message status
```json
{
  "status": "pending|assigned|in_progress|resolved|closed"
}
```

## Case Assignment Endpoints

### POST /api/assignments
Create new case assignment
```json
{
  "distress_message_id": "number",
  "assigned_to": "number",
  "director_instructions": "string"
}
```

### GET /api/assignments/cadet/:id
Get assignments for specific cadet

## Case Updates Endpoints

### POST /api/updates
Add case update
```json
{
  "distress_message_id": "number",
  "action_taken": "string",
  "remarks": "string"
}
```

### GET /api/updates/:messageId
Get updates for specific message

## File Attachment Endpoints

### POST /api/attachments
Upload file attachment
```
multipart/form-data
- file: File
- distress_message_id: number
```

### GET /api/attachments/:messageId
Get attachments for specific message

## User Management Endpoints

### POST /api/users
Create new user (Admin only)
```json
{
  "username": "string",
  "password": "string",
  "role": "admin|director|front_office|cadet"
}
```

### GET /api/users
Get list of users (Admin only)

### PUT /api/users/:id
Update user details (Admin only)
```json
{
  "role": "string",
  "active": "boolean"
}
```

## Report Endpoints

### GET /api/reports/performance
Get performance reports
- Cases handled
- Resolution time
- Status distribution

### GET /api/reports/analytics
Get system analytics
- Message trends
- Response times
- User activity
