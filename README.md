# 🚨 Distress Management System

A comprehensive web application for managing and responding to distress messages and emergency cases, built with React, Node.js, and MySQL. This system provides a streamlined workflow for handling emergency situations with role-based access control and real-time updates.

## ✨ Key Features

### 🔐 User Authentication & Authorization
- Secure JWT-based authentication system
- Role-based access control with granular permissions
- Session management and token refresh
- Password hashing and security best practices

### 🆘 Distress Case Management
- Intuitive case creation and tracking
- Priority-based case assignment system
- Detailed case history and audit trail
- Status updates and resolution tracking
- Advanced search and filtering capabilities

### 📱 Real-time Communication
- Instant notifications for case assignments
- Real-time case status updates
- In-app messaging system
- Email notifications for critical updates

### 📊 Dashboard & Reporting
- Interactive dashboard with key metrics
- Customizable reports and analytics
- Performance tracking and KPIs
- Exportable data in multiple formats

### 📎 File & Document Management
- Secure file upload and storage
- Document version control
- Support for multiple file types
- Attachment preview and management

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18
- **UI Library**: Material-UI (MUI)
- **State Management**: React Context API
- **Data Fetching**: Axios
- **Form Handling**: React Hook Form
- **Routing**: React Router DOM
- **Styling**: CSS Modules & Styled Components
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MySQL 8.0+
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Logging**: Winston
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

### Development Tools
- **Version Control**: Git
- **Package Manager**: npm
- **API Testing**: Postman
- **Code Quality**: ESLint, Prettier
- **Containerization**: Docker (optional)

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Git
- npm (v8 or higher) or Yarn

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Keith-ngaira/Distress-management-system-FULL.git
cd Distress-management-system-FULL
```

2. **Backend Setup**

```bash
# Install dependencies
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit the .env file with your configuration
```

3. **Database Setup**

```bash
# Create and seed the database
npm run db:setup

# Or manually import the schema
mysql -u your_username -p < src/database/schema.sql
```

4. **Frontend Setup**

```bash
cd ../frontend
npm install

# Set up environment variables
cp .env.example .env
# Edit the .env file with your API URL
```

### Environment Variables

#### Backend (`.env`)

```env
# Server Configuration
PORT=5556
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=management
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# File Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880 # 5MB

# CORS
FRONTEND_URL=http://localhost:3002

# Logging
LOG_LEVEL=info
```

#### Frontend (`.env`)

```env
REACT_APP_API_URL=http://localhost:5556
PORT=3002
NODE_ENV=development
```

### 🏃 Running the Application

1. **Start the Backend**

```bash
cd backend

# Development mode with hot-reload
npm run dev

# Production mode
npm start
```

2. **Start the Frontend**

```bash
cd frontend

# Development server
npm run dev

# Production build
npm run build
npm run preview
```

3. **Access the Application**

- Frontend: http://localhost:3002
- Backend API: http://localhost:5556
- API Documentation: http://localhost:5556/api-docs (if Swagger is enabled)

### 👥 Default User Roles

The system includes the following default user roles with different permission levels:

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| Admin | admin | admin123 | Full system access and user management |
| Director | director | director123 | Oversight and reporting access |
| Front Office | frontoffice | frontoffice123 | Case management and assignment |
| Cadet | cadet | cadet123 | Case handling and updates |

> **Security Note**: Change default passwords immediately after first login.

## 📁 Project Structure

```
distress-management-system/
├── backend/                     # Backend Node.js application
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/         # Request handlers
│   │   ├── database/            # Database models, migrations, and seeders
│   │   │   ├── migrations/      # Database migrations
│   │   │   ├── models/          # Sequelize models
│   │   │   └── seeders/         # Database seed data
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.js          # Authentication middleware
│   │   │   ├── error.js         # Error handling middleware
│   │   │   └── validation.js    # Request validation
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   ├── utils/               # Utility functions
│   │   ├── validators/          # Request validation schemas
│   │   ├── app.js               # Express application setup
│   │   └── server.js            # Server entry point
│   ├── uploads/                 # File upload directory
│   ├── .env                     # Environment variables
│   ├── package.json             # Backend dependencies
│   └── README.md                # Backend documentation
│
├── frontend/                    # React frontend application
│   ├── public/                  # Static files
│   └── src/
│       ├── assets/             # Static assets (images, fonts, etc.)
│       ├── components/          # Reusable React components
│       │   ├── common/          # Common UI components
│       │   ├── layout/          # Layout components
│       │   └── ui/              # Basic UI elements
│       ├── contexts/            # React context providers
│       ├── hooks/               # Custom React hooks
│       ├── pages/               # Page components
│       │   ├── auth/            # Authentication pages
│       │   ├── dashboard/       # Dashboard pages
│       │   └── cases/           # Case management pages
│       ├── services/            # API services and data fetching
│       ├── theme/               # UI theme configuration
│       ├── utils/               # Utility functions
│       ├── App.js               # Main application component
│       └── index.js             # Application entry point
│
├── docs/                      # Project documentation
│   ├── api/                    # API documentation
│   ├── architecture/           # System architecture
│   ├── database/               # Database schema and diagrams
│   └── user-guides/            # User documentation
│
├── .gitignore                 # Git ignore file
├── package.json                # Root package.json
└── README.md                   # Project documentation (this file)
```

## 📚 Documentation

### System Documentation

- [System Architecture](docs/architecture/overview.md) - High-level system design and architecture
- [Database Schema](docs/database/schema.md) - Database design and relationships
- [API Reference](docs/api/README.md) - Complete API documentation
  - [Authentication API](docs/api/authentication.md)
  - [Users API](docs/api/users.md)
  - [Cases API](docs/api/cases.md)
  - [Files API](docs/api/files.md)

### User Guides

- [Getting Started](docs/user-guides/getting-started.md)
- [User Manual](docs/user-guides/user-manual.md)
- [Administrator Guide](docs/user-guides/admin-guide.md)
- [Troubleshooting](docs/user-guides/troubleshooting.md)

### Development

- [Development Setup](docs/development/setup.md)
- [Coding Standards](docs/development/coding-standards.md)
- [Testing Guide](docs/development/testing.md)
- [Deployment Guide](docs/development/deployment.md)

### API Documentation

For detailed API documentation, you can:

1. Run the backend server in development mode
2. Visit `/api-docs` for interactive Swagger documentation
3. Or check the Postman collection in `docs/api/postman/`

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Secure password hashing with bcrypt
- Session management with token expiration
- CSRF protection

### Data Protection
- Input validation and sanitization
- Protection against SQL injection
- Parameterized queries with Sequelize
- Secure headers with Helmet
- CORS configuration
- Rate limiting for API endpoints

### File Security
- File type validation
- Size restrictions on uploads
- Secure file storage
- Virus scanning (if configured)
- Content security policies

### Best Practices
- Environment-based configuration
- Secure error handling
- Request validation
- Secure dependencies (npm audit)
- Regular security updates

## 👥 Contributing

We welcome contributions from the community! Here's how you can help:

1. **Report Bugs**
   - Check existing issues to avoid duplicates
   - Provide detailed reproduction steps
   - Include environment information

2. **Suggest Enhancements**
   - Describe the new feature or improvement
   - Explain why it would be valuable
   - Include any relevant references

3. **Submit Pull Requests**
   - Fork the repository
   - Create a feature branch (`git checkout -b feature/amazing-feature`)
   - Commit your changes (`git commit -m 'Add amazing feature'`)
   - Push to the branch (`git push origin feature/amazing-feature`)
   - Open a Pull Request

### Development Workflow

1. Create an issue describing the bug or feature
2. Assign the issue to yourself if you're working on it
3. Follow the coding standards and write tests
4. Ensure all tests pass
5. Update documentation as needed
6. Submit a pull request with a clear description

### Code Style
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Write tests for new features

### Commit Message Guidelines
- Use present tense ("Add feature" not "Added feature")
- Keep the first line under 50 characters
- Reference issues and pull requests liberally
- Consider using [Conventional Commits](https://www.conventionalcommits.org/)
## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors who have helped improve this project
- Built with ❤️ by Keith Ngaira
- Special thanks to our beta testers and users for their valuable feedback

## 📞 Support

For support, please contact our team or open an issue in the repository.

## 📈 Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/Keith-ngaira/Distress-management-system-FULL/tags).

## 🤝 Code of Conduct

Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details on our code of conduct.

## 🔍 Looking Ahead

### Planned Features
- Mobile application
- Real-time chat support
- Advanced analytics dashboard
- Integration with emergency services
- Multi-language support

### Known Issues
For a list of known issues and upcoming fixes, please check our [issues page](https://github.com/Keith-ngaira/Distress-management-system-FULL/issues).

---

<div align="center">
  <sub>Built with ❤︎ by Keith Ngaira</sub>
</div>

## License

This project is licensed under the MIT License.

## Contact

Keith Ngaira - [GitHub](https://github.com/Keith-ngaira)
