# Deployment Guide

## System Requirements

### Hardware Requirements
- CPU: 2+ cores
- RAM: 4GB minimum
- Storage: 20GB minimum

### Software Requirements
- Node.js v14 or higher
- MySQL 5.7 or higher
- XAMPP (for development)
- Modern web browser

## Development Setup

1. **Clone Repository**
```bash
git clone [repository-url]
cd distress-management-system
```

2. **Install Dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Database Setup**
- Start XAMPP
- Create database
- Import schema
- Import initial data

4. **Environment Configuration**
```bash
# Backend .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=management
JWT_SECRET=your_jwt_secret
PORT=5000

# Frontend .env
REACT_APP_API_URL=http://localhost:5000/api
```

## Production Deployment

### Backend Deployment

1. **Build TypeScript**
```bash
cd backend
npm run build
```

2. **Set Production Environment**
```bash
NODE_ENV=production
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=management
JWT_SECRET=your_secure_jwt_secret
```

3. **Start Server**
```bash
npm start
```

### Frontend Deployment

1. **Build React App**
```bash
cd frontend
npm run build
```

2. **Serve Build**
- Copy build folder to web server
- Configure web server (nginx/apache)
- Set up SSL certificate

### Database Deployment

1. **Backup Development Database**
```sql
mysqldump -u root management > backup.sql
```

2. **Restore to Production**
```sql
mysql -u prod_user -p management < backup.sql
```

## Security Considerations

1. **SSL/TLS Configuration**
- Install SSL certificate
- Force HTTPS
- Configure secure headers

2. **Firewall Setup**
- Allow required ports
- Block unnecessary access
- Set up rate limiting

3. **Database Security**
- Strong passwords
- Limited access
- Regular backups

## Monitoring

1. **System Health**
- CPU usage
- Memory usage
- Disk space
- Network traffic

2. **Application Logs**
- Error tracking
- Access logs
- Performance metrics

3. **Database Monitoring**
- Query performance
- Connection pool
- Storage usage

## Backup Procedures

1. **Database Backups**
- Daily automated backups
- Weekly full backups
- Monthly archives

2. **File Backups**
- Document storage
- System configurations
- User uploads

3. **Backup Verification**
- Regular restore tests
- Integrity checks
- Access verification
