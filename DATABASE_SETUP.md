# 🗄️ Database Setup Guide

## 📋 **Overview**

The entire system now uses the unified `backend/src/database/schema.sql` file for all database operations.

## 🎯 **Quick Setup**

### **Option 1: Automated Setup (Recommended)**

```bash
cd backend
npm run setup-db
```

### **Option 2: Manual MySQL Import**

```bash
mysql -u root -p < backend/src/database/schema.sql
```

Enter your password: ` `

## 📁 **What's Included in schema.sql**

### **✅ Database Creation**

- Creates `management` database if it doesn't exist
- Sets proper charset and collation

### **✅ Complete Table Structure**

- **users** - User authentication and roles
- **distress_messages** - Core distress case management
- **case_updates** - Case progress tracking
- **case_assignments** - Task assignments
- **attachments** - File uploads
- **notifications** - User notifications
- **audit_logs** - System audit trail
- **cleanup_events** - Maintenance operations

### **✅ Test Data**

- **admin** / admin123 (admin role)
- **director** / director123 (director role)
- **frontoffice** / frontoffice123 (front_office role)
- **cadet** / cadet123 (cadet role)

### **✅ Optimized Indexes**

- Performance indexes on all frequently queried columns
- Foreign key relationships with proper constraints
- Search indexes for text fields

## 🔧 **Your Configuration**

### **Database Settings** (from your .env)

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=management
DB_PORT=3306
```

### **Connection String**

```
mysql://root:(yourpassword)@localhost:3306/management
```

## 🧪 **Verification Steps**

### **1. Check Database Creation**

```sql
SHOW DATABASES LIKE 'management';
```

### **2. Verify Tables**

```sql
USE management;
SHOW TABLES;
```

### **3. Check Test Users**

```sql
SELECT username, role, email FROM users;
```

### **4. Test Login**

Try logging into the application with:

- Username: `admin`
- Password: `admin123`

## 🔄 **System Integration**

### **Backend Connection** ✅

- Automatically connects to MySQL using your credentials
- Connection pooling configured for performance
- Error handling with retry logic

### **API Endpoints** ✅

- All endpoints use the unified database schema
- Consistent data validation and sanitization
- Role-based access control implemented

### **Frontend Integration** ✅

- Login page configured for your user credentials
- Dashboard ready for data display
- Error handling for database connection issues

## 🛠️ **Maintenance Commands**

### **Reset Database**

```bash
cd backend
npm run setup-db
```

### **Check Connection**

```bash
mysql -u root -p management -e "SELECT 'Connection successful!' as status;"
```

### **Backup Database**

```bash
mysqldump -u root -p management > backup_$(date +%Y%m%d).sql
```

## 🎉 **Ready to Use!**

Your database is now:

- ✅ **Configured** with your MySQL credentials
- ✅ **Structured** with the complete schema
- ✅ **Populated** with test data
- ✅ **Optimized** for performance
- ✅ **Integrated** with the entire system

**Start the application and test with the provided credentials!**
