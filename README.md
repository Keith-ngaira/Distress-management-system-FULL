# Distress Management System

A comprehensive web application for managing and responding to distress messages, built with React and Node.js.

## Features

- **User Authentication & Authorization**

  - Role-based access control (Admin, Director, Front Office, Cadet)
  - Secure JWT-based authentication
  - Password encryption and security measures

- **Distress Message Management**

  - Create and track distress messages
  - Assign cases to specific users
  - Priority-based case handling
  - Case updates and resolution tracking

- **Real-time Notifications**

  - Instant notifications for new assignments
  - Case update notifications
  - Unread notification tracking

- **Dashboard & Analytics**

  - Case statistics and metrics
  - Performance tracking
  - Status-based case filtering

- **File Management**
  - Secure file uploads and storage
  - Support for multiple file types
  - Attachment management system

## Tech Stack

### Frontend

- React.js
- Material-UI (MUI)
- React Query for data fetching
- Context API for state management
- Axios for API communication

### Backend

- Node.js & Express.js
- MySQL database
- JWT for authentication
- Multer for file uploads
- Winston for logging

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Keith-ngaira/Distress-management-system-FULL.git
cd Distress-management-system-FULL
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Set up backend environment variables:
   - Create a .env file in the backend directory
   - Add the following variables:

```makefile
PORT=5556
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=management
DB_PORT=3306
JWT_SECRET=your_jwt_secret
UPLOAD_DIR=uploads
FRONTEND_URL=http://localhost:3002
```

4. Initialize the database:

```bash
# Option 1: Automated setup (recommended)
npm run setup-db

# Option 2: Manual import
mysql -u your_user -p < src/database/schema.sql
```

5. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

6. Set up frontend environment variables:
   - Create a .env file in the frontend directory
   - Add:

```makefile
REACT_APP_API_URL=http://localhost:5556
PORT=3002
```

### Running the Application

1. Start the backend server:

```bash
cd backend
npm run start
```

2. Start the frontend development server:

```bash
cd frontend
npm start
```

The application will be available at:

- Frontend: http://localhost:3002
- Backend API: http://localhost:5556

### Default Users

The system comes with pre-configured users:

- Admin: username: admin, password: admin123
- Director: username: director, password: director123
- Front Office: username: frontoffice, password: frontoffice123
- Cadet: username: cadet, password: cadet123

## Project Structure

```
distress-management-system/
├── backend/                # Backend Node.js application
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── database/      # Database schemas and migrations
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utility functions
│   └── uploads/          # File upload directory
├── frontend/             # React frontend application
│   ├── public/          # Static files
│   └── src/
│       ├── components/  # Reusable React components
│       ├── contexts/    # React contexts
│       ├── pages/      # Page components
│       ├── services/   # API services
│       └── theme/      # UI theme configuration
└── docs/               # Project documentation
```

## Documentation

Detailed documentation is available in the docs directory:

- [System Overview](docs/01-system-overview.md)
- [User Roles & Permissions](docs/02-user-roles-and-permissions.md)
- [Workflows](docs/03-workflows.md)
- [API Documentation](docs/04-api-documentation.md)
- [Deployment Guide](docs/05-deployment-guide.md)

## Security Features

- CORS protection
- JWT token authentication
- Password hashing
- Input validation
- SQL injection prevention
- File upload validation
- Rate limiting
- Secure headers with Helmet

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

Keith Ngaira - [GitHub](https://github.com/Keith-ngaira)
