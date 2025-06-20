# Database Connectivity Guide - Distress Management System

## 🎯 Overview

This guide provides comprehensive instructions for connecting the Distress Management System to your MySQL database. The system has been fully updated to work with real database operations while maintaining a robust fallback system.

---

## 📋 Prerequisites

### 1. MySQL Server Requirements

- **MySQL Version**: 8.0 or higher (recommended)
- **Storage Engine**: InnoDB
- **Character Set**: utf8mb4
- **Collation**: utf8mb4_unicode_ci

### 2. System Requirements

- **Node.js**: 16.x or higher
- **Memory**: Minimum 2GB RAM available
- **Disk Space**: At least 1GB free space for database and logs

---

## ⚙️ Configuration Steps

### Step 1: Environment Configuration

1. **Copy the environment template:**

   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit the `.env` file with your database credentials:**

   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=management
   DB_PORT=3306

   # Optional: Enable SSL (if your database requires it)
   DB_SSL=false

   # Optional: Database connection pool settings
   DB_CONNECTION_LIMIT=20
   DB_QUEUE_LIMIT=0
   DB_ACQUIRE_TIMEOUT=60000
   DB_TIMEOUT=60000

   # Server Configuration
   NODE_ENV=production
   PORT=5556

   # JWT Configuration (CHANGE THIS IN PRODUCTION!)
   JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-very-long-and-random

   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

### Step 2: Database Setup

**Option A: Automated Setup (Recommended)**

```bash
cd backend
npm run setup-db
```

**Option B: Manual Setup**

```bash
# Connect to MySQL as root or admin user
mysql -u root -p

# Create database
CREATE DATABASE management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create dedicated user (recommended for production)
CREATE USER 'distress_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON management.* TO 'distress_user'@'localhost';
FLUSH PRIVILEGES;

# Import schema
USE management;
SOURCE backend/src/database/schema.sql;
```

### Step 3: Verify Connection

1. **Start the backend server:**

   ```bash
   cd backend
   npm start
   ```

2. **Check the logs for connection status:**

   - Look for: `✅ MySQL database connection established successfully`
   - Or: `❌ MySQL database connection test failed`

3. **Test the health endpoint:**
   ```bash
   curl http://localhost:5556/health
   ```

---

## 🔧 Database Features Implemented

### 1. Enhanced Connection Management

- **Connection Pooling**: Optimized pool management with 20 concurrent connections
- **Automatic Reconnection**: Handles connection drops gracefully
- **Health Monitoring**: Periodic connection health checks
- **Timeout Handling**: Configurable timeouts for reliability

### 2. Comprehensive Error Handling

- **Graceful Degradation**: Falls back to mock data when database unavailable
- **Retry Logic**: Automatic retry with exponential backoff
- **Detailed Logging**: Comprehensive error logging for debugging
- **User-Friendly Messages**: Clear error messages for common issues

### 3. Database Operations

#### User Management

- ✅ **Create Users**: Full user creation with role validation
- ✅ **Update Users**: Partial and full user updates
- ✅ **Delete Users**: Safe deletion with cascade handling
- ✅ **Authentication**: Secure password hashing and verification
- ✅ **Statistics**: User statistics by role and activity

#### Distress Messages

- ✅ **CRUD Operations**: Complete create, read, update, delete functionality
- ✅ **Advanced Filtering**: Filter by status, priority, date, country, etc.
- ✅ **Search Functionality**: Full-text search across multiple fields
- ✅ **Pagination**: Efficient pagination for large datasets
- ✅ **Case Updates**: Track case progress with timestamped updates

#### Case Assignments

- ✅ **Assignment Management**: Director-driven case assignment workflow
- ✅ **Team Workload**: Monitor team member workload and performance
- ✅ **Reassignment**: Handle case reassignments with audit trail
- ✅ **Statistics**: Assignment statistics and completion metrics

#### Dashboard Data

- ✅ **Role-Specific Data**: Customized data for each user role
- ✅ **Real-time Statistics**: Live case and performance statistics
- ✅ **Performance Metrics**: Response times, resolution rates, etc.
- ✅ **Team Analytics**: Comprehensive team performance tracking

### 4. Security Features

- **SQL Injection Prevention**: Parameterized queries throughout
- **Password Security**: bcrypt hashing with salt rounds
- **Access Control**: Role-based permissions on all operations
- **Audit Logging**: Track all database operations
- **Data Validation**: Comprehensive input validation

---

## 📊 Database Schema Overview

### Core Tables

#### users

- **Purpose**: Store user accounts and authentication data
- **Key Features**: Role-based access, activity tracking, secure password storage
- **Indexes**: Optimized for username, email, and role queries

#### distress_messages

- **Purpose**: Central repository for all distress cases
- **Key Features**: Priority management, status tracking, assignment workflow
- **Indexes**: Optimized for searches, filtering, and reporting

#### case_assignments

- **Purpose**: Track case assignments and director instructions
- **Key Features**: Assignment history, director instructions, completion tracking
- **Indexes**: Optimized for assignee workload and director oversight

#### case_updates

- **Purpose**: Store case progress updates and communications
- **Key Features**: Timestamped updates, user attribution, full audit trail
- **Indexes**: Optimized for case timeline views

#### notifications

- **Purpose**: System notifications and user communications
- **Key Features**: Read/unread tracking, expiration, targeted delivery
- **Indexes**: Optimized for user notification queries

#### audit_logs

- **Purpose**: Comprehensive audit trail for all system operations
- **Key Features**: Action tracking, before/after values, IP logging
- **Indexes**: Optimized for audit queries and compliance reporting

---

## 🚀 Performance Optimization

### 1. Database Optimization

- **Indexes**: Strategic indexing for all query patterns
- **Connection Pooling**: Efficient connection management
- **Query Optimization**: Optimized queries with proper JOINs
- **Caching Strategy**: Application-level caching where appropriate

### 2. Application Performance

- **Lazy Loading**: Load data only when needed
- **Pagination**: Efficient pagination for large datasets
- **Error Handling**: Fast fallback to mock data
- **Connection Monitoring**: Proactive connection health checks

---

## 🔍 Troubleshooting

### Common Connection Issues

#### 1. Connection Refused (ECONNREFUSED)

**Symptoms**: `MySQL database connection test failed: connect ECONNREFUSED`

**Solutions**:

- Verify MySQL server is running: `sudo systemctl status mysql`
- Check if MySQL is listening on correct port: `netstat -an | grep 3306`
- Verify firewall settings allow connections
- Check MySQL configuration file (`my.cnf`)

#### 2. Access Denied (ER_ACCESS_DENIED_ERROR)

**Symptoms**: `Access denied for user 'username'@'localhost'`

**Solutions**:

- Verify username and password in `.env` file
- Check user permissions: `SHOW GRANTS FOR 'username'@'localhost';`
- Ensure user has necessary privileges on the database
- Try connecting manually: `mysql -u username -p -h localhost`

#### 3. Database Not Found (ER_BAD_DB_ERROR)

**Symptoms**: `Unknown database 'management'`

**Solutions**:

- Create the database: `CREATE DATABASE management;`
- Verify database name in `.env` file matches actual database
- Run the setup script: `npm run setup-db`

#### 4. SSL Connection Issues

**Symptoms**: SSL connection errors

**Solutions**:

- Set `DB_SSL=false` in `.env` if SSL is not required
- Configure SSL certificates if required by your MySQL setup
- Check MySQL SSL configuration

### Performance Issues

#### 1. Slow Queries

**Solutions**:

- Enable query logging: `LOG_SQL_QUERIES=true` in development
- Review slow query log in MySQL
- Check if indexes are being used: `EXPLAIN` queries
- Monitor connection pool usage

#### 2. Connection Pool Exhaustion

**Solutions**:

- Increase `DB_CONNECTION_LIMIT` in `.env`
- Check for connection leaks in application logs
- Monitor connection usage patterns
- Optimize query execution times

---

## 📈 Monitoring & Maintenance

### 1. Health Monitoring

```bash
# Check system health
curl http://localhost:5556/health

# Monitor connection status
tail -f backend/logs/app.log | grep "database"
```

### 2. Performance Monitoring

- Monitor query execution times
- Track connection pool usage
- Monitor memory usage
- Set up alerts for connection failures

### 3. Database Maintenance

- Regular backups
- Index optimization
- Log rotation
- Performance tuning

---

## 🔐 Production Deployment

### 1. Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use dedicated database user with minimal privileges
- [ ] Enable SSL connections if required
- [ ] Set up firewall rules
- [ ] Configure secure passwords
- [ ] Enable audit logging

### 2. Performance Checklist

- [ ] Optimize MySQL configuration
- [ ] Set up connection pooling
- [ ] Configure proper indexes
- [ ] Set up monitoring
- [ ] Configure log rotation
- [ ] Set up backup strategy

### 3. Monitoring Setup

- [ ] Database performance monitoring
- [ ] Connection health checks
- [ ] Error alerting
- [ ] Log aggregation
- [ ] Backup verification

---

## 📞 Support & Resources

### Documentation

- [MySQL 8.0 Documentation](https://dev.mysql.com/doc/refman/8.0/en/)
- [Node.js MySQL2 Package](https://github.com/sidorares/node-mysql2)
- [Database Schema Reference](backend/src/database/schema.sql)

### Getting Help

1. Check application logs: `backend/logs/app.log`
2. Review MySQL error logs
3. Test connection manually with MySQL client
4. Verify environment configuration

### Sample Scripts

```bash
# Test database connection
node backend/src/scripts/testConnection.js

# Reset database (WARNING: Destroys all data)
npm run reset-db

# Backup database
mysqldump -u username -p management > backup.sql

# Restore database
mysql -u username -p management < backup.sql
```

---

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **Backend Logs**:

   ```
   ✅ MySQL database connection established successfully
   ℹ️  Retrieved X users from database
   ℹ️  Dashboard data fetched successfully for admin user: username
   ```

2. **Frontend Behavior**:

   - All dashboards loading real data
   - User management operations working
   - Case creation and updates functioning
   - No "fallback mode" indicators

3. **Health Check Response**:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-01-20T10:30:00.000Z",
     "uptime": 3600,
     "database": {
       "connected": true,
       "lastCheck": "2025-01-20T10:30:00.000Z"
     }
   }
   ```

**Your Distress Management System is now fully connected to the database and ready for production use!** 🚀

---

_Last Updated: January 20, 2025_  
_System Version: 1.0.0_
