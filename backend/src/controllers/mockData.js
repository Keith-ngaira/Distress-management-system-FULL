// Mock data for development when MySQL is not available
export const mockUsers = [
  {
    id: 1,
    username: "admin",
    password: "$2b$10$NKxDv2xBS3.Pc0mMHlATQuMi.auxS0Gaoers5FqPFtqejiNRK/OYm", // admin123
    email: "admin@distressms.com",
    role: "admin",
    is_active: true,
    last_login: "2024-01-15T14:30:00Z",
    created_at: "2024-01-01T08:00:00Z",
    updated_at: "2024-01-15T14:30:00Z",
  },
  {
    id: 2,
    username: "john_admin",
    password: "$2b$10$NKxDv2xBS3.Pc0mMHlATQuMi.auxS0Gaoers5FqPFtqejiNRK/OYm", // admin123
    email: "john.admin@distressms.com",
    role: "admin",
    is_active: true,
    last_login: "2024-01-14T16:45:00Z",
    created_at: "2024-01-02T09:15:00Z",
    updated_at: "2024-01-14T16:45:00Z",
  },
  {
    id: 3,
    username: "sarah_admin",
    password: "$2b$10$NKxDv2xBS3.Pc0mMHlATQuMi.auxS0Gaoers5FqPFtqejiNRK/OYm", // admin123
    email: "sarah.admin@distressms.com",
    role: "admin",
    is_active: false,
    last_login: "2024-01-10T12:20:00Z",
    created_at: "2024-01-03T10:30:00Z",
    updated_at: "2024-01-10T12:20:00Z",
  },
  {
    id: 4,
    username: "director",
    password: "$2b$10$66.a0QLBw5BjeEPAqFMcUuQBApkvJ5yKb3fNCKIdl/o.iT29A2Dna", // director123
    email: "director@distressms.com",
    role: "director",
    is_active: true,
    last_login: "2024-01-15T15:00:00Z",
    created_at: "2024-01-01T08:15:00Z",
    updated_at: "2024-01-15T15:00:00Z",
  },
  {
    id: 5,
    username: "michael_dir",
    password: "$2b$10$66.a0QLBw5BjeEPAqFMcUuQBApkvJ5yKb3fNCKIdl/o.iT29A2Dna", // director123
    email: "michael.director@distressms.com",
    role: "director",
    is_active: true,
    last_login: "2024-01-15T11:30:00Z",
    created_at: "2024-01-02T08:45:00Z",
    updated_at: "2024-01-15T11:30:00Z",
  },
  {
    id: 6,
    username: "lisa_dir",
    password: "$2b$10$66.a0QLBw5BjeEPAqFMcUuQBApkvJ5yKb3fNCKIdl/o.iT29A2Dna", // director123
    email: "lisa.director@distressms.com",
    role: "director",
    is_active: true,
    last_login: "2024-01-14T17:15:00Z",
    created_at: "2024-01-03T09:00:00Z",
    updated_at: "2024-01-14T17:15:00Z",
  },
  {
    id: 7,
    username: "frontoffice",
    password: "$2b$10$pk/89H4ej95La1swZcjvLeRD6NKg8TP7xo/YiGuVR3hGA2YYBrM1.", // frontoffice123
    email: "frontoffice@distressms.com",
    role: "front_office",
    is_active: true,
    last_login: "2024-01-15T16:20:00Z",
    created_at: "2024-01-01T08:30:00Z",
    updated_at: "2024-01-15T16:20:00Z",
  },
  {
    id: 8,
    username: "alex_front",
    password: "$2b$10$pk/89H4ej95La1swZcjvLeRD6NKg8TP7xo/YiGuVR3hGA2YYBrM1.", // frontoffice123
    email: "alex.front@distressms.com",
    role: "front_office",
    is_active: true,
    last_login: "2024-01-15T14:10:00Z",
    created_at: "2024-01-02T09:30:00Z",
    updated_at: "2024-01-15T14:10:00Z",
  },
  {
    id: 9,
    username: "maria_front",
    password: "$2b$10$pk/89H4ej95La1swZcjvLeRD6NKg8TP7xo/YiGuVR3hGA2YYBrM1.", // frontoffice123
    email: "maria.front@distressms.com",
    role: "front_office",
    is_active: true,
    last_login: "2024-01-15T12:50:00Z",
    created_at: "2024-01-03T10:45:00Z",
    updated_at: "2024-01-15T12:50:00Z",
  },
  {
    id: 10,
    username: "cadet",
    password: "$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW", // cadet123
    email: "cadet@distressms.com",
    role: "cadet",
    is_active: true,
    last_login: "2024-01-15T17:00:00Z",
    created_at: "2024-01-01T09:00:00Z",
    updated_at: "2024-01-15T17:00:00Z",
  },
  {
    id: 11,
    username: "peter_cadet",
    password: "$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW", // cadet123
    email: "peter.cadet@distressms.com",
    role: "cadet",
    is_active: true,
    last_login: "2024-01-15T13:20:00Z",
    created_at: "2024-01-02T10:15:00Z",
    updated_at: "2024-01-15T13:20:00Z",
  },
  {
    id: 12,
    username: "julia_cadet",
    password: "$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW", // cadet123
    email: "julia.cadet@distressms.com",
    role: "cadet",
    is_active: true,
    last_login: "2024-01-15T11:45:00Z",
    created_at: "2024-01-03T11:30:00Z",
    updated_at: "2024-01-15T11:45:00Z",
  },
];

export const mockDashboardData = {
  stats: {
    total: 10,
    pending: 2,
    assigned: 3,
    active: 3,
    resolved: 2,
    avgFirstResponse: 25,
    avgResolutionTime: 4,
  },
  priorityStats: [
    { priority: "urgent", count: 3, avgFirstResponse: 15 },
    { priority: "high", count: 3, avgFirstResponse: 20 },
    { priority: "medium", count: 2, avgFirstResponse: 30 },
    { priority: "low", count: 2, avgFirstResponse: 45 },
  ],
  caseCategories: [
    { name: "Medical Emergency", count: 3 },
    { name: "Ship Emergency", count: 2 },
    { name: "Missing Person", count: 2 },
    { name: "Aviation Emergency", count: 1 },
    { name: "Natural Disaster", count: 2 },
  ],
  recentCases: [
    {
      id: 1,
      subject: "Medical Emergency at Sea",
      status: "pending",
      priority: "urgent",
      createdAt: "2024-01-15T17:20:00Z",
      assignedTo: "Unassigned",
      folio_number: "DM011",
      country_of_origin: "Greece",
    },
    {
      id: 2,
      subject: "Mass Casualty Event",
      status: "assigned",
      priority: "urgent",
      createdAt: "2024-01-15T10:45:00Z",
      assignedTo: "alex_front",
      folio_number: "DM010",
      country_of_origin: "Spain",
    },
    {
      id: 3,
      subject: "Humanitarian Crisis",
      status: "in_progress",
      priority: "high",
      createdAt: "2024-01-14T11:25:00Z",
      assignedTo: "peter_cadet",
      folio_number: "DM007",
      country_of_origin: "Somalia",
    },
    {
      id: 4,
      subject: "Aircraft Emergency",
      status: "assigned",
      priority: "high",
      createdAt: "2024-01-13T16:40:00Z",
      assignedTo: "maria_front",
      folio_number: "DM004",
      country_of_origin: "Australia",
    },
    {
      id: 5,
      subject: "Security Incident",
      status: "resolved",
      priority: "medium",
      createdAt: "2024-01-08T15:30:00Z",
      assignedTo: "julia_cadet",
      folio_number: "DM008",
      country_of_origin: "France",
    },
  ],
};

// Director-specific dashboard data
export const mockDirectorData = {
  ...mockDashboardData,
  directorStats: {
    totalTeamMembers: 12,
    frontOfficeStaff: 5,
    cadets: 7,
    activeCases: 6,
    pendingAssignments: 2,
    overdueReports: 1,
    teamPerformance: 87,
  },
  teamWorkload: [
    {
      member: "alex_front",
      role: "front_office",
      activeCases: 2,
      avgResponseTime: 18,
      performance: 94,
    },
    {
      member: "maria_front",
      role: "front_office",
      activeCases: 1,
      avgResponseTime: 22,
      performance: 89,
    },
    {
      member: "david_front",
      role: "front_office",
      activeCases: 3,
      avgResponseTime: 15,
      performance: 96,
    },
    {
      member: "peter_cadet",
      role: "cadet",
      activeCases: 2,
      avgResponseTime: 28,
      performance: 85,
    },
    {
      member: "julia_cadet",
      role: "cadet",
      activeCases: 1,
      avgResponseTime: 32,
      performance: 82,
    },
    {
      member: "mark_cadet",
      role: "cadet",
      activeCases: 3,
      avgResponseTime: 25,
      performance: 88,
    },
  ],
  caseAssignments: [
    {
      id: 1,
      caseId: 2,
      folio: "DM010",
      subject: "Mass Casualty Event",
      assignedTo: "alex_front",
      assignedBy: "director",
      priority: "urgent",
      instructions:
        "Priority medical response required - coordinate with local hospitals",
      assignedDate: "2024-01-15T10:45:00Z",
      status: "active",
    },
    {
      id: 2,
      caseId: 3,
      folio: "DM007",
      subject: "Humanitarian Crisis",
      assignedTo: "peter_cadet",
      assignedBy: "director",
      priority: "high",
      instructions:
        "Expedite humanitarian aid delivery - work with NGO partners",
      assignedDate: "2024-01-14T11:25:00Z",
      status: "active",
    },
    {
      id: 3,
      caseId: 4,
      folio: "DM004",
      subject: "Aircraft Emergency",
      assignedTo: "maria_front",
      assignedBy: "director",
      priority: "high",
      instructions:
        "Aviation emergency procedures in effect - coordinate with ATC",
      assignedDate: "2024-01-13T16:40:00Z",
      status: "active",
    },
  ],
  urgentAlerts: [
    {
      id: 1,
      type: "pending_case",
      title: "Unassigned Urgent Case",
      message: "Medical Emergency at Sea (DM011) requires immediate assignment",
      priority: "urgent",
      createdAt: "2024-01-15T17:20:00Z",
    },
    {
      id: 2,
      type: "overdue_report",
      title: "Overdue Case Update",
      message: "Missing Person case (DM003) - No updates in 24 hours",
      priority: "high",
      createdAt: "2024-01-15T08:00:00Z",
    },
  ],
};

// Front Office specific dashboard data
export const mockFrontOfficeData = {
  ...mockDashboardData,
  frontOfficeStats: {
    casesCreated: 8,
    casesAssigned: 5,
    pendingReports: 2,
    avgResponseTime: 18,
    caseResolutionRate: 92,
    urgentCases: 3,
  },
  myCases: [
    {
      id: 2,
      folio_number: "DM010",
      subject: "Mass Casualty Event",
      status: "assigned",
      priority: "urgent",
      country_of_origin: "Spain",
      distressed_person_name: "Multiple Patients",
      created_at: "2024-01-15T10:45:00Z",
      assigned_date: "2024-01-15T10:50:00Z",
      director_instructions:
        "Priority medical response required - coordinate with local hospitals",
      last_update: "2024-01-15T12:30:00Z",
    },
    {
      id: 4,
      folio_number: "DM004",
      subject: "Aircraft Emergency",
      status: "in_progress",
      priority: "high",
      country_of_origin: "Australia",
      distressed_person_name: "Sarah Davis",
      created_at: "2024-01-13T16:40:00Z",
      assigned_date: "2024-01-13T17:00:00Z",
      director_instructions:
        "Aviation emergency procedures in effect - coordinate with ATC",
      last_update: "2024-01-14T09:15:00Z",
    },
    {
      id: 8,
      folio_number: "DM008",
      subject: "Security Incident",
      status: "resolved",
      priority: "medium",
      country_of_origin: "France",
      distressed_person_name: "Airport Staff",
      created_at: "2024-01-08T15:30:00Z",
      assigned_date: "2024-01-08T15:45:00Z",
      director_instructions: "Security protocols must be followed",
      last_update: "2024-01-08T17:20:00Z",
      resolved_at: "2024-01-08T17:20:00Z",
    },
  ],
  recentUpdates: [
    {
      id: 1,
      case_id: 2,
      folio_number: "DM010",
      update_text:
        "Coordinated with Hospital General - 15 ambulances dispatched to scene",
      updated_at: "2024-01-15T12:30:00Z",
      updated_by: "alex_front",
    },
    {
      id: 2,
      case_id: 4,
      folio_number: "DM004",
      update_text: "Emergency landing successful - rescue teams on site",
      updated_at: "2024-01-14T09:15:00Z",
      updated_by: "maria_front",
    },
    {
      id: 3,
      case_id: 8,
      folio_number: "DM008",
      update_text: "All clear - suspicious package confirmed safe",
      updated_at: "2024-01-08T17:20:00Z",
      updated_by: "david_front",
    },
  ],
  quickActions: [
    {
      id: 1,
      title: "Create New Case",
      description: "Report a new distress situation",
      icon: "add_circle",
      action: "create_case",
      urgent: false,
    },
    {
      id: 2,
      title: "Update Urgent Cases",
      description: "3 urgent cases need status updates",
      icon: "warning",
      action: "update_urgent",
      urgent: true,
    },
    {
      id: 3,
      title: "Pending Reports",
      description: "2 cases require detailed reports",
      icon: "assignment",
      action: "pending_reports",
      urgent: false,
    },
  ],
  casesByStatus: {
    pending: 0,
    assigned: 2,
    in_progress: 1,
    resolved: 2,
  },
  performanceMetrics: {
    thisWeek: {
      casesHandled: 5,
      avgResponseTime: "18 min",
      resolutionRate: "92%",
      satisfaction: "4.7/5",
    },
    thisMonth: {
      casesHandled: 23,
      avgResponseTime: "22 min",
      resolutionRate: "89%",
      satisfaction: "4.6/5",
    },
  },
};

let userIdCounter = mockUsers.length + 1;

export const findUserById = (id) => {
  return mockUsers.find((user) => user.id === parseInt(id));
};

export const findUserByUsername = (username) => {
  return mockUsers.find((user) => user.username === username);
};

export const findUserByEmail = (email) => {
  return mockUsers.find((user) => user.email === email);
};

export const createMockUser = (userData) => {
  const newUser = {
    id: userIdCounter++,
    ...userData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockUsers.push(newUser);
  return newUser;
};

export const updateMockUser = (id, updates) => {
  const userIndex = mockUsers.findIndex((user) => user.id === parseInt(id));
  if (userIndex === -1) return null;

  mockUsers[userIndex] = {
    ...mockUsers[userIndex],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  return mockUsers[userIndex];
};

export const deleteMockUser = (id) => {
  const userIndex = mockUsers.findIndex((user) => user.id === parseInt(id));
  if (userIndex === -1) return false;

  mockUsers.splice(userIndex, 1);
  return true;
};
