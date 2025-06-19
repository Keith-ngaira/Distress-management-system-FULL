# MySQL Database Setup Instructions

## Prerequisites

1. **Install MySQL Server** (if not already installed)

### For Ubuntu/Debian:

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### For macOS (using Homebrew):

```bash
brew install mysql
brew services start mysql
```

### For Windows:

Download and install MySQL from: https://dev.mysql.com/downloads/mysql/

## Database Configuration

1. **Start MySQL service:**

```bash
# Ubuntu/Debian
sudo systemctl start mysql

# macOS
brew services start mysql

# Windows - MySQL should start automatically
```

2. **Connect to MySQL and create database:**

```bash
mysql -u root -p
```

Then run these SQL commands:

```sql
CREATE DATABASE IF NOT EXISTS distress_management;
CREATE USER IF NOT EXISTS 'distress_user'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON distress_management.* TO 'distress_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

3. **Update your backend/.env file with your MySQL credentials:**

```env
# Database Configuration
DB_TYPE=mysql
DB_HOST=localhost
DB_USER=distress_user
DB_PASSWORD=your_password_here
DB_NAME=distress_management
DB_PORT=3306
```

4. **Run the database setup script:**

```bash
cd backend
npm run setup-mysql
```

## Alternative: Using root user (for development only)

If you want to use the root user (not recommended for production):

1. **Set root password (if needed):**

```bash
sudo mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_root_password';
FLUSH PRIVILEGES;
EXIT;
```

2. **Update backend/.env:**

```env
DB_TYPE=mysql
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_root_password
DB_NAME=distress_management
DB_PORT=3306
```

3. **Run setup:**

```bash
cd backend
npm run setup-mysql
```

## Verify Setup

After setup, restart the development server:

```bash
npm run dev
```

You should see: `✅ MySQL database connection test successful`

## Test Users

The setup script creates these test users:

- **admin/password123** (admin role)
- **director/password123** (director role)
- **frontoffice/password123** (front_office role)
- **cadet/password123** (cadet role)

## Troubleshooting

### Common Issues:

1. **Connection refused**: MySQL service not running

   ```bash
   sudo systemctl start mysql  # Linux
   brew services start mysql   # macOS
   ```

2. **Access denied**: Wrong credentials in .env file

3. **Database doesn't exist**: Run `npm run setup-mysql` to create it

4. **Port already in use**: Another service using port 3306
   ```bash
   sudo netstat -tlnp | grep :3306
   ```

### Checking MySQL Status:

```bash
# Linux
sudo systemctl status mysql

# macOS
brew services list | grep mysql

# All systems
mysqladmin -u root -p status
```

## Production Notes

For production deployment:

1. Use a dedicated MySQL user (not root)
2. Use strong passwords
3. Configure proper firewall rules
4. Enable SSL/TLS connections
5. Regular backups
