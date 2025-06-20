# Connect to Your Local MySQL Database

## Current Status

✅ **System is working** with SQLite fallback  
✅ **Backend running** on port 5556  
✅ **Frontend running** and compiled successfully  
⚠️ **MySQL connection** will be used when available

## Your MySQL Setup

Based on your information:

- **Host**: localhost
- **Port**: 3306
- **User**: root
- **SSL**: TLS_AES_128_GC (enabled)

## To Connect to Your MySQL Database

### 1. Update Backend Environment

Edit `backend/.env` file:

```env
# Database Configuration
DB_TYPE=mysql
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_ROOT_PASSWORD
DB_NAME=management
DB_PORT=3306
```

### 2. Create the Database

Connect to your MySQL and run:

```sql
CREATE DATABASE IF NOT EXISTS management;
USE management;
```

### 3. Run the Schema

```sql
-- Copy and paste the contents of backend/src/database/schema.sql
-- or run: source /path/to/backend/src/database/schema.sql
```

### 4. Test Connection

```bash
cd backend
npm run setup-db
```

### 5. Restart Development Server

```bash
npm run dev
```

## Test Users (when using MySQL)

After setting up the database, these users will be available:

- **admin** / admin123 (admin role)
- **director** / director123 (director role)
- **frontoffice** / frontoffice123 (front_office role)
- **cadet** / cadet123 (cadet role)
- **Keith** / (existing password) (director role)
- **John** / (existing password) (cadet role)
- **Doe** / (existing password) (cadet role)

## Current SQLite Test Users

With the current SQLite setup, use:

- **admin** / admin123 (admin role)
- **director** / director123 (director role)
- **frontoffice** / frontoffice123 (front_office role)
- **cadet** / cadet123 (cadet role)

## Troubleshooting

### If MySQL connection fails:

1. Check if MySQL service is running in your environment
2. Verify the password in the .env file
3. Ensure the `management` database exists
4. The system will automatically fall back to SQLite

### To force MySQL connection:

Remove the SQLite fallback by editing `backend/src/db.js` and removing the try/catch block around MySQL connection.

## Development vs Production

**Current Setup (Development):**

- ✅ Auto-fallback to SQLite if MySQL unavailable
- ✅ Works immediately without setup
- ✅ Good for development and testing

**Your MySQL Setup (Production-Ready):**

- 🎯 Uses your existing MySQL database
- 🎯 Matches your README.md specifications
- 🎯 Production-ready configuration
- 🎯 SSL-enabled connection
