// Mock data for development when MySQL is not available
export const mockUsers = [
  {
    id: 1,
    username: "admin",
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
    },
    {
      id: 2,
      subject: "Mass Casualty Event",
      status: "assigned",
      priority: "urgent",
      createdAt: "2024-01-15T10:45:00Z",
      assignedTo: "alex_front",
    },
    {
      id: 3,
      subject: "Humanitarian Crisis",
      status: "in_progress",
      priority: "high",
      createdAt: "2024-01-14T11:25:00Z",
      assignedTo: "peter_cadet",
    },
    {
      id: 4,
      subject: "Aircraft Emergency",
      status: "assigned",
      priority: "high",
      createdAt: "2024-01-13T16:40:00Z",
      assignedTo: "maria_front",
    },
    {
      id: 5,
      subject: "Security Incident",
      status: "resolved",
      priority: "medium",
      createdAt: "2024-01-08T15:30:00Z",
      assignedTo: "julia_cadet",
    },
  ],
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
