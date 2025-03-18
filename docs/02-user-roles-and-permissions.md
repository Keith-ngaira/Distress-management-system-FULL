# User Roles and Permissions

## Role Hierarchy

The system implements a role-based access control (RBAC) system with four distinct roles:

### 1. Administrator (admin)
**Primary Responsibilities:**
- System configuration and maintenance
- User account management
- Access control management
- System-wide monitoring

**Permissions:**
- Create, modify, and delete user accounts
- Assign and modify user roles
- Access all system features
- Generate system-wide reports
- Configure system settings

### 2. Director (director)
**Primary Responsibilities:**
- Case assignment and oversight
- Performance monitoring
- Policy enforcement
- Resource allocation

**Permissions:**
- Assign cases to cadets
- View all distress messages
- Approve/reject proposed actions
- Set case priorities
- Access department reports

### 3. Front Office Staff (front_office)
**Primary Responsibilities:**
- Initial case registration
- Document management
- Basic case tracking
- Communication handling

**Permissions:**
- Create new distress messages
- Upload and manage attachments
- Update message details
- View assigned messages
- Generate basic reports

### 4. Cadet (cadet)
**Primary Responsibilities:**
- Case handling
- Status updates
- Documentation
- Communication

**Permissions:**
- View assigned cases
- Update case status
- Add case notes
- Upload case documents
- Track assigned cases
