# 🎯 **Front Office Dashboard - Emergency Response Center**

## 🚀 **Overview**

The Front Office Dashboard is a comprehensive emergency response center designed specifically for front office staff to create, manage, and update distress cases. It integrates seamlessly with the database schema and provides all the tools front office staff need for effective emergency case handling.

## 📋 **Key Features Based on Schema Requirements**

### ✅ **1. Distress Message Management**

From the `distress_messages` table with full CRUD capabilities:

- **📝 Create New Cases** - Front office can create new distress messages with all required fields
- **📊 Case Tracking** - Monitor all assigned cases with real-time status updates
- **🔄 Status Updates** - Add progress updates and case notes
- **📈 Case Resolution** - Track cases from creation to resolution

### ✅ **2. Role-Based Case Operations**

Based on front office permissions (`create`, `read`, `update`):

- **➕ Case Creation** - Full form for creating comprehensive distress cases
- **👀 Case Visibility** - View all cases assigned to the user
- **✏️ Case Updates** - Add status updates and progress notes
- **📋 Case Details** - Access complete case information and history

### ✅ **3. Performance Monitoring**

Integrated tracking for professional development:

- **⏱️ Response Time Tracking** - Monitor average response times
- **📊 Resolution Metrics** - Track case completion rates
- **📈 Performance Goals** - Weekly and monthly targets
- **⭐ Quality Ratings** - Satisfaction scores and feedback

### ✅ **4. Emergency Protocols & Procedures**

Step-by-step guidance for emergency situations:

- **🚨 Emergency Response Steps** - Structured protocols for different scenarios
- **📞 Emergency Contacts** - Quick access to essential contact information
- **📋 Standard Procedures** - Best practices for case handling
- **🎯 Quick Actions** - Immediate access to critical functions

## 🎛️ **Dashboard Sections**

### **Main Statistics Cards**

- **My Active Cases** - Cases currently assigned to the user
- **Cases Created** - Total cases created this month
- **Avg Response Time** - Current performance metric
- **Urgent Cases** - High-priority cases requiring immediate attention

### **Quick Actions Panel**

- **🚀 Create New Case** - Immediate access to case creation
- **⚠️ Update Urgent Cases** - Priority cases needing attention
- **📋 Pending Reports** - Cases requiring detailed documentation

### **Tab 1: My Cases**

- **📋 Assigned Cases Table** - Complete view of current workload:

  - Folio numbers from `distress_messages.folio_number`
  - Case subjects and detailed information
  - Priority levels and current status
  - Director instructions when available
  - Country of origin and person details
  - Last update timestamps

- **➕ Case Creation Dialog** - Comprehensive case creation form:

  - Sender information and contact details
  - Subject and case description
  - Country of origin and affected person
  - Nature of emergency and priority level
  - Detailed case information

- **✏️ Case Update Dialog** - Progress tracking interface:
  - Review director instructions
  - Add detailed status updates
  - Document actions taken
  - Plan next steps

### **Tab 2: Recent Updates**

- **📝 Update History** - Chronological view of recent case activities:
  - Case updates with folio numbers
  - Update author and timestamp
  - Detailed update descriptions
  - Visual timeline of activities

### **Tab 3: Performance**

- **📊 Weekly Performance** - Current week metrics:

  - Cases handled count
  - Average response time
  - Resolution rate percentage
  - Quality satisfaction scores

- **📈 Monthly Overview** - Progress tracking:
  - Cases handled progress bars
  - Response time goal tracking
  - Quality score indicators
  - Performance targets

### **Tab 4: Emergency Protocols**

- **🚨 Response Procedures** - Step-by-step emergency handling:

  - Immediate assessment guidelines
  - Initial response procedures
  - Coordination protocols
  - Follow-up requirements

- **📞 Emergency Contacts** - Critical contact information:
  - Director hotline numbers
  - Coast Guard communications
  - Medical emergency contacts
  - Local authority connections

## 🔑 **Front Office Specific Functionality**

### **Case Management Rights**

- **Create Cases** - Full distress message creation capability
- **Update Assigned Cases** - Progress tracking and status updates
- **View Case Details** - Access to complete case information
- **Documentation** - Detailed reporting and record keeping

### **Database Integration**

All features connect directly to the schema:

- **`distress_messages`** - Full CRUD operations for case management
- **`case_updates`** - Progress tracking and status documentation
- **`users`** - User identification and assignment tracking
- **`notifications`** - Alert system for urgent cases

## 🎨 **User Interface Features**

### **Professional Emergency Response Design**

- **🎯 Quick Access** - Floating action button for immediate case creation
- **🚨 Urgent Alerts** - Priority case highlighting and notifications
- **📱 Responsive Design** - Optimized for all devices and screen sizes
- **🔔 Visual Indicators** - Color-coded priority and status systems

### **Intuitive Navigation**

- **📋 Tabbed Interface** - Organized sections for different functions
- **🔍 Search & Filter** - Easy case location and sorting
- **📊 Visual Progress** - Progress bars and completion indicators
- **⚡ Quick Actions** - One-click access to common operations

## 🚀 **How to Access**

### **Login as Front Office Staff:**

1. **Username**: `frontoffice` / **Password**: `frontoffice123`
2. **Alternative Front Office Accounts**:
   - `alex_front` / `frontoffice123`
   - `maria_front` / `frontoffice123`
   - `david_front` / `frontoffice123`

### **Dashboard Features:**

- Automatically displays front office-specific dashboard
- All tabs and features immediately functional
- Mock data provides realistic scenario testing
- Real-time updates when database is connected

## 📊 **Sample Data**

The front office dashboard comes with comprehensive mock data including:

- **5 Assigned Cases** - Mix of priorities and statuses
- **Recent Updates** - Case progress documentation examples
- **Performance Metrics** - Realistic response times and efficiency scores
- **Emergency Protocols** - Standard operating procedures
- **Quick Actions** - Priority case notifications

## 🎯 **Production Readiness**

### **Database Integration**

- **MySQL Compatibility** - Full schema integration ready
- **Fallback Mechanism** - Works with or without database
- **API Endpoints** - Complete REST API for all case operations
- **Error Handling** - Graceful degradation and user feedback

### **Security Features**

- **Role-Based Access** - Front office specific functionality
- **Permission Checks** - Proper authorization for case operations
- **Input Validation** - Secure data handling and sanitization
- **Authentication** - JWT-based security system

### **Emergency Response Capabilities**

- **Immediate Case Creation** - Rapid emergency documentation
- **Real-time Updates** - Live case status tracking
- **Director Communication** - Instruction display and acknowledgment
- **Protocol Guidance** - Step-by-step emergency procedures

## 📋 **Case Management Workflow**

### **Creating New Cases:**

1. **Click "Create New Case"** - Access case creation form
2. **Fill Required Information** - Sender, subject, country, person details
3. **Set Priority Level** - Low, medium, high, or urgent
4. **Add Case Details** - Comprehensive emergency description
5. **Submit for Assignment** - Case enters system for director assignment

### **Managing Assigned Cases:**

1. **Review Director Instructions** - Understand specific requirements
2. **Track Case Progress** - Monitor status and milestones
3. **Add Regular Updates** - Document actions and progress
4. **Coordinate Response** - Work with emergency services
5. **Complete Documentation** - Final reporting and closure

### **Performance Monitoring:**

1. **Track Response Times** - Monitor efficiency metrics
2. **Review Case Load** - Manage workload distribution
3. **Quality Assessment** - Satisfaction and completion rates
4. **Goal Achievement** - Weekly and monthly targets

**The Front Office Dashboard is fully functional and ready for emergency response operations!** 🚨

Login with front office credentials to experience the complete emergency case management system.
