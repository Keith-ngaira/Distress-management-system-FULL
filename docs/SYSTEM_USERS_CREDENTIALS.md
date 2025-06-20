# 👥 System Users & Credentials Documentation

## Overview

The Distress Management System comes pre-configured with comprehensive test users across all role types. This documentation provides login credentials for testing and development purposes, along with user management information.

## ��� Default User Credentials

### 🔑 Universal Password Information

- **Admin Password**: `admin123`
- **Director Password**: `director123`
- **Front Office Password**: `frontoffice123`
- **Cadet Password**: `cadet123`

## 👨‍💼 Administrator Users (3 Users)

### Primary Admin Account

- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@distressms.com`
- **Role**: `admin`
- **Status**: ✅ Active
- **Last Login**: 2024-01-15 14:30:00

### Additional Admin Accounts

| Username      | Email                      | Status      | Last Login          |
| ------------- | -------------------------- | ----------- | ------------------- |
| `john_admin`  | john.admin@distressms.com  | ✅ Active   | 2024-01-14 16:45:00 |
| `sarah_admin` | sarah.admin@distressms.com | ❌ Inactive | 2024-01-10 12:20:00 |

## 🎯 Director Users (5 Users)

### Primary Director Account

- **Username**: `director`
- **Password**: `director123`
- **Email**: `director@distressms.com`
- **Role**: `director`
- **Status**: ✅ Active
- **Last Login**: 2024-01-15 15:00:00

### Additional Director Accounts

| Username      | Email                           | Status      | Last Login          |
| ------------- | ------------------------------- | ----------- | ------------------- |
| `michael_dir` | michael.director@distressms.com | ✅ Active   | 2024-01-15 11:30:00 |
| `lisa_dir`    | lisa.director@distressms.com    | ✅ Active   | 2024-01-14 17:15:00 |
| `james_dir`   | james.director@distressms.com   | ✅ Active   | 2024-01-13 13:45:00 |
| `emma_dir`    | emma.director@distressms.com    | ❌ Inactive | 2024-01-12 16:30:00 |

## 🏢 Front Office Users (8 Users)

### Primary Front Office Account

- **Username**: `frontoffice`
- **Password**: `frontoffice123`
- **Email**: `frontoffice@distressms.com`
- **Role**: `front_office`
- **Status**: ✅ Active
- **Last Login**: 2024-01-15 16:20:00

### Additional Front Office Accounts

| Username       | Email                       | Status      | Last Login          |
| -------------- | --------------------------- | ----------- | ------------------- |
| `alex_front`   | alex.front@distressms.com   | ✅ Active   | 2024-01-15 14:10:00 |
| `maria_front`  | maria.front@distressms.com  | ✅ Active   | 2024-01-15 12:50:00 |
| `david_front`  | david.front@distressms.com  | ✅ Active   | 2024-01-14 18:30:00 |
| `sophie_front` | sophie.front@distressms.com | ✅ Active   | 2024-01-14 15:40:00 |
| `ryan_front`   | ryan.front@distressms.com   | ❌ Inactive | 2024-01-13 10:20:00 |
| `anna_front`   | anna.front@distressms.com   | ✅ Active   | 2024-01-12 14:15:00 |
| `tom_front`    | tom.front@distressms.com    | ✅ Active   | 2024-01-11 16:45:00 |

## 🎓 Cadet Users (15 Users)

### Primary Cadet Account

- **Username**: `cadet`
- **Password**: `cadet123`
- **Email**: `cadet@distressms.com`
- **Role**: `cadet`
- **Status**: ✅ Active
- **Last Login**: 2024-01-15 17:00:00

### Additional Cadet Accounts

| Username       | Email                       | Status      | Last Login          |
| -------------- | --------------------------- | ----------- | ------------------- |
| `peter_cadet`  | peter.cadet@distressms.com  | ✅ Active   | 2024-01-15 13:20:00 |
| `julia_cadet`  | julia.cadet@distressms.com  | ✅ Active   | 2024-01-15 11:45:00 |
| `mark_cadet`   | mark.cadet@distressms.com   | ✅ Active   | 2024-01-14 19:10:00 |
| `lucy_cadet`   | lucy.cadet@distressms.com   | ✅ Active   | 2024-01-14 16:30:00 |
| `chris_cadet`  | chris.cadet@distressms.com  | ❌ Inactive | 2024-01-13 12:15:00 |
| `nina_cadet`   | nina.cadet@distressms.com   | ✅ Active   | 2024-01-13 14:50:00 |
| `kevin_cadet`  | kevin.cadet@distressms.com  | ✅ Active   | 2024-01-12 17:25:00 |
| `grace_cadet`  | grace.cadet@distressms.com  | ✅ Active   | 2024-01-12 15:40:00 |
| `daniel_cadet` | daniel.cadet@distressms.com | ✅ Active   | 2024-01-11 18:15:00 |
| `amy_cadet`    | amy.cadet@distressms.com    | ❌ Inactive | 2024-01-11 13:30:00 |
| `robert_cadet` | robert.cadet@distressms.com | ✅ Active   | 2024-01-10 16:20:00 |
| `claire_cadet` | claire.cadet@distressms.com | ✅ Active   | 2024-01-10 14:35:00 |
| `lucas_cadet`  | lucas.cadet@distressms.com  | ✅ Active   | 2024-01-09 19:00:00 |

## 📊 User Statistics Summary

| Role             | Total Users | Active Users | Inactive Users |
| ---------------- | ----------- | ------------ | -------------- |
| **Admin**        | 3           | 2            | 1              |
| **Director**     | 5           | 4            | 1              |
| **Front Office** | 8           | 6            | 2              |
| **Cadet**        | 15          | 12           | 3              |
| **TOTAL**        | **31**      | **24**       | **7**          |

## 🔒 Security Information

### Password Encryption

- All passwords are encrypted using **bcrypt** with salt rounds
- Original passwords are never stored in plain text
- Hash format: `$2b$10$...` (bcrypt with 10 salt rounds)

### Password Hashes (for reference)

- **admin123**: `$2b$10$NKxDv2xBS3.Pc0mMHlATQuMi.auxS0Gaoers5FqPFtqejiNRK/OYm`
- **director123**: `$2b$10$66.a0QLBw5BjeEPAqFMcUuQBApkvJ5yKb3fNCKIdl/o.iT29A2Dna`
- **frontoffice123**: `$2b$10$pk/89H4ej95La1swZcjvLeRD6NKg8TP7xo/YiGuVR3hGA2YYBrM1.`
- **cadet123**: `$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW`

## 🎯 Role-Based Access Control

### Admin Role Permissions

- ✅ User management (create, read, update, delete)
- ✅ System configuration
- ✅ View all distress messages
- ✅ Assign cases to directors
- ✅ Generate system reports
- ✅ Access audit logs

### Director Role Permissions

- ✅ Case assignment and management
- ✅ Team monitoring and supervision
- ✅ Performance analytics
- ✅ Strategic planning dashboard
- ✅ Assign cases to front office staff
- ✅ Review case progress and outcomes

### Front Office Role Permissions

- ✅ Create and manage distress messages
- ✅ Initial case processing
- ✅ Communication with external parties
- ✅ Document management
- ✅ Status updates and reporting
- ✅ Basic case analytics

### Cadet Role Permissions

- ✅ View assigned cases
- ✅ Training module access
- ✅ Skills development tracking
- ✅ Performance monitoring
- ✅ Communication with supervisors
- ✅ Personal dashboard and progress

## 🚀 Quick Login Testing

### For Developers & Testers

**Admin Testing:**

```
Username: admin
Password: admin123
```

**Director Testing:**

```
Username: director
Password: director123
```

**Front Office Testing:**

```
Username: frontoffice
Password: frontoffice123
```

**Cadet Testing:**

```
Username: cadet
Password: cadet123
```

## 🔧 User Management

### Creating New Users

```javascript
// API endpoint for creating users
POST /api/users
Authorization: Bearer {admin_token}

{
  "username": "new_user",
  "password": "secure_password",
  "email": "user@distressms.com",
  "role": "cadet" // admin, director, front_office, cadet
}
```

### Updating User Status

```javascript
// API endpoint for updating user status
PUT /api/users/:userId
Authorization: Bearer {admin_token}

{
  "is_active": true/false
}
```

### Password Reset (Admin Only)

```javascript
// API endpoint for password reset
PUT /api/users/:userId/password
Authorization: Bearer {admin_token}

{
  "new_password": "new_secure_password"
}
```

## 📋 Login Page Features

### Demo Credentials Display

The futuristic login page includes quick-fill buttons for each role:

- **Admin Demo** - Fills admin credentials
- **Director Demo** - Fills director credentials
- **Front Office Demo** - Fills front office credentials
- **Cadet Demo** - Fills cadet credentials

### Role Detection

The login page automatically detects user roles based on username and displays appropriate role icons.

## 🔍 Database Setup

### Automatic User Creation

Users are automatically created when running the database setup script:

```bash
# Run database setup
cd backend
node src/scripts/setupDb.js
```

### Manual Database Population

If you need to manually add users to the database:

```sql
-- Use the pre-generated INSERT statements from schema.sql
-- Located in: backend/src/database/schema.sql
-- Starting from line ~100
```

## ⚠️ Security Recommendations

### For Production Deployment

1. **Change Default Passwords**

   - Never use default passwords in production
   - Implement strong password policies
   - Force password changes on first login

2. **User Account Management**

   - Disable unused test accounts
   - Regular audit of user access
   - Implement account lockout policies

3. **Enhanced Security**
   - Enable two-factor authentication
   - Implement session timeout
   - Regular security audits

### For Development/Testing

1. **Keep Credentials Secure**

   - Don't commit real credentials to version control
   - Use environment variables for sensitive data
   - Rotate test credentials regularly

2. **Access Control**
   - Limit admin access to authorized personnel only
   - Use role-based testing approaches
   - Monitor user activity during testing

## 📱 Multi-Device Testing

All user accounts work across:

- ✅ Desktop browsers
- ✅ Mobile browsers
- ✅ Tablet interfaces
- ✅ Different screen resolutions

## 🔄 Account Maintenance

### Regular Tasks

- **Weekly**: Review inactive accounts
- **Monthly**: Audit user permissions
- **Quarterly**: Update test data and credentials

### Monitoring

- Track login patterns
- Monitor failed login attempts
- Review user activity logs

## 📚 Related Documentation

- [Notification System](NOTIFICATION_SYSTEM.md)
- [Dashboard Functionality Report](DASHBOARD_FUNCTIONALITY_REPORT.md)
- [Database Connectivity Guide](DATABASE_CONNECTIVITY_GUIDE.md)
- [API Documentation](docs/04-api-documentation.md)

## 🤝 Support

For user account issues:

1. Check account status (active/inactive)
2. Verify correct username/password combination
3. Check role permissions for specific functionality
4. Review error logs for authentication issues

All user accounts are ready for immediate testing and development use across the entire Distress Management System.
