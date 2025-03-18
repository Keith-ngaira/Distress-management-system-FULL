# Distress Message Management System

A comprehensive system for managing distress messages, case assignments, and workflow tracking.

## System Overview

The Distress Message Management System is a full-stack application built with:
- Backend: Node.js + ReactJS + Express
- Frontend: React.js + ReactJS + Material-UI
- Database: MySQL

## Quick Start

1. **Prerequisites**
   - Node.js (v14 or higher)
   - MySQL (via XAMPP)
   - npm or yarn

2. **Installation**

```bash
# Clone the repository
git clone [repository-url]

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Database Setup**
   - Start XAMPP
   - Open phpMyAdmin
   - Import the schema from `backend/src/database/schema.sql`
   - Import initial data from `backend/src/database/init-admin.sql`

4. **Environment Setup**
   Create a `.env` file in the backend directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=management
JWT_SECRET=your_jwt_secret
```

5. **Running the Application**
```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm start
```

## Default Users

The system comes with four default users:
- Admin: username: `admin`, password: `admin123`
- Director: username: `director`, password: `director123`
- Front Office: username: `frontoffice`, password: `frontoffice123`
- Cadet: username: `cadet`, password: `cadet123`

## Documentation

For detailed documentation, please refer to the `/docs` directory.
