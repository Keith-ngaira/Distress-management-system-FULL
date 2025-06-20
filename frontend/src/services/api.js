import axios from "axios";

// Detect if running in Builder.io proxy environment
const isBuilderProxy = window.location.hostname.includes("builder.codes");
const API_BASE_URL = isBuilderProxy
  ? "/api" // Use relative URL with /api prefix for proxy
  : process.env.REACT_APP_API_URL || "http://localhost:5556/api";

// Log API configuration in development only
if (process.env.NODE_ENV === "development") {
  console.log("API Configuration:", {
    isBuilderProxy,
    hostname: window.location.hostname,
    API_BASE_URL,
    environment: process.env.NODE_ENV,
  });
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000, // 30 second timeout
});

// Database connectivity state
let databaseConnected = false;
let lastConnectivityCheck = 0;
const CONNECTIVITY_CHECK_INTERVAL = 60000; // 1 minute

// Request interceptor for adding auth token and checking database connectivity
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (process.env.NODE_ENV === "development") {
      console.log("API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        databaseConnected,
      });
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor for handling errors and connectivity status
api.interceptors.response.use(
  (response) => {
    // Check if response indicates fallback mode
    if (response.data && response.data.fallback) {
      databaseConnected = false;
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "API Response using fallback data - database not connected",
        );
      }
    } else {
      databaseConnected = true;
    }

    if (process.env.NODE_ENV === "development") {
      console.log("API Response:", {
        status: response.status,
        url: response.config.url,
        data: response.data,
        fallback: response.data?.fallback || false,
        databaseConnected,
      });
    }
    return response;
  },
  async (error) => {
    if (process.env.NODE_ENV === "development") {
      console.error("API Error Details:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url,
      });
    }

    const originalRequest = error.config;

    // Handle specific error cases
    if (error.response?.status === 503) {
      // Service unavailable - likely database connection issue
      databaseConnected = false;
      console.warn("Database service unavailable");
    }

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear invalid token
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

// Database connectivity helper functions
export const getDatabaseConnectivityStatus = () => databaseConnected;

export const checkDatabaseConnectivity = async () => {
  const now = Date.now();
  if (now - lastConnectivityCheck < CONNECTIVITY_CHECK_INTERVAL) {
    return databaseConnected;
  }

  try {
    const response = await api.get("/health");
    databaseConnected = response.data?.database?.connected || false;
    lastConnectivityCheck = now;
    return databaseConnected;
  } catch (error) {
    console.error("Database connectivity check failed:", error);
    databaseConnected = false;
    lastConnectivityCheck = now;
    return false;
  }
};

// Auth endpoints
export const auth = {
  login: async (username, password) => {
    const response = await api.post("/auth/login", { username, password });
    const { data } = response;
    if (!data?.success || !data?.data?.token || !data?.data?.user) {
      throw new Error(data?.message || "Invalid response format from server");
    }

    // Store both token and user data
    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data.user));

    return data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.warn("Logout request failed:", error.message);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },

  changePassword: async (data) => {
    const response = await api.post("/auth/change-password", data);
    const { data: responseData } = response;
    if (!responseData?.success) {
      throw new Error(
        responseData?.message || "Invalid response format from server",
      );
    }
    return responseData;
  },

  refreshToken: async () => {
    const response = await api.post("/auth/refresh");
    const { data } = response;
    if (!data?.success || !data?.data?.token) {
      throw new Error(data?.message || "Token refresh failed");
    }

    // Update stored token
    localStorage.setItem("token", data.data.token);
    return data;
  },

  verifyToken: async () => {
    const response = await api.get("/auth/verify");
    const { data } = response;
    if (!data?.success) {
      throw new Error(data?.message || "Token verification failed");
    }
    return data;
  },

  getProfile: async () => {
    const response = await api.get("/api/auth/profile");
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },
};

// User endpoints
export const users = {
  getCurrent: async () => {
    const response = await api.get("/api/users/me");
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  getAll: async () => {
    const response = await api.get("/api/users");
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/users/${id}`);
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  getByRole: async (role) => {
    const response = await api.get(`/api/users/role/${role}`);
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  getStatistics: async () => {
    const response = await api.get("/api/users/statistics");
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  create: async (userData) => {
    const response = await api.post("/api/users", userData);
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  update: async (userId, userData) => {
    const response = await api.put(`/api/users/${userId}`, userData);
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  delete: async (userId) => {
    const response = await api.delete(`/api/users/${userId}`);
    const { data } = response;
    if (!data?.success) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data;
  },
};

// Distress messages endpoints
export const distressMessages = {
  getAll: async (filters = {}) => {
    const response = await api.get("/api/distress-messages", {
      params: filters,
    });
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/distress-messages/${id}`);
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  getStatistics: async () => {
    const response = await api.get("/api/distress-messages/statistics");
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  create: async (messageData) => {
    const response = await api.post("/api/distress-messages", messageData);
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  update: async (id, messageData) => {
    const response = await api.put(`/api/distress-messages/${id}`, messageData);
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/distress-messages/${id}`);
    const { data } = response;
    if (!data?.success) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data;
  },

  addUpdate: async (id, updateData) => {
    const response = await api.post(
      `/api/distress-messages/${id}/updates`,
      updateData,
    );
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  assign: async (id, assigneeId, instructions) => {
    const response = await api.post(`/api/distress-messages/${id}/assign`, {
      assignee_id: assigneeId,
      instructions,
    });
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },
};

// Case updates endpoints
export const caseUpdates = {
  create: async (messageId, updateData) => {
    const response = await api.post(
      `/api/distress-messages/${messageId}/updates`,
      updateData,
    );
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  getByMessageId: async (messageId) => {
    const response = await api.get(
      `/api/distress-messages/${messageId}/updates`,
    );
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },
};

// Notification endpoints
export const notifications = {
  getAll: async () => {
    const response = await api.get("/api/notifications");
    const { data } = response;
    if (!data?.success || !data?.data?.notifications) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  getUnreadCount: async () => {
    const response = await api.get("/api/notifications/unread-count");
    const { data } = response;
    if (!data?.success || data?.data?.count === undefined) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/api/notifications/${id}/read`);
    const { data } = response;
    if (!data?.success) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data;
  },

  markAllAsRead: async () => {
    const response = await api.put("/api/notifications/mark-all-read");
    const { data } = response;
    if (!data?.success) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/notifications/${id}`);
    const { data } = response;
    if (!data?.success) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data;
  },
};

// Attachments endpoints
export const attachments = {
  upload: async (distressMessageId, file, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 300000, // 5 minute timeout for file uploads
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        onProgress(percentCompleted);
      };
    }

    const response = await api.post(
      `/api/attachments/${distressMessageId}/upload`,
      formData,
      config,
    );

    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  getByMessageId: async (distressMessageId) => {
    const response = await api.get(`/api/attachments/${distressMessageId}`);
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  download: async (id) => {
    const response = await api.get(`/api/attachments/download/${id}`, {
      responseType: "blob",
      timeout: 120000, // 2 minute timeout for downloads
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/attachments/${id}`);
    const { data } = response;
    if (!data?.success) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data;
  },
};

// Dashboard endpoints
export const dashboard = {
  getDashboardData: async () => {
    const response = await api.get("/api/dashboard");
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  fetchStatusData: async (filters = {}) => {
    const response = await api.get("/api/reports/status", { params: filters });
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },
};

// Case Assignment endpoints (Director functionality)
export const caseAssignments = {
  getAll: async () => {
    const response = await api.get("/api/case-assignments");
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  create: async (assignmentData) => {
    const response = await api.post("/api/case-assignments", assignmentData);
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  update: async (id, updateData) => {
    const response = await api.put(`/api/case-assignments/${id}`, updateData);
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/case-assignments/${id}`);
    const { data } = response;
    if (!data?.success) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data;
  },

  getTeamWorkload: async () => {
    const response = await api.get("/api/case-assignments/team-workload");
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },
};

// Health check endpoint
export const health = {
  check: async () => {
    const response = await api.get("/health");
    return response.data;
  },
};

// Add error boundary for API calls
const withErrorBoundary = (apiCall) => {
  return async (...args) => {
    try {
      return await apiCall(...args);
    } catch (error) {
      console.error("API Error:", error);

      // Add additional context for debugging
      if (error.response) {
        console.error("Response Error:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      }

      throw error;
    }
  };
};

// Wrap all exported functions with error boundary
Object.keys(auth).forEach((key) => {
  auth[key] = withErrorBoundary(auth[key]);
});

Object.keys(users).forEach((key) => {
  users[key] = withErrorBoundary(users[key]);
});

Object.keys(distressMessages).forEach((key) => {
  distressMessages[key] = withErrorBoundary(distressMessages[key]);
});

Object.keys(caseUpdates).forEach((key) => {
  caseUpdates[key] = withErrorBoundary(caseUpdates[key]);
});

Object.keys(notifications).forEach((key) => {
  notifications[key] = withErrorBoundary(notifications[key]);
});

Object.keys(attachments).forEach((key) => {
  attachments[key] = withErrorBoundary(attachments[key]);
});

Object.keys(dashboard).forEach((key) => {
  dashboard[key] = withErrorBoundary(dashboard[key]);
});

Object.keys(caseAssignments).forEach((key) => {
  caseAssignments[key] = withErrorBoundary(caseAssignments[key]);
});

Object.keys(health).forEach((key) => {
  health[key] = withErrorBoundary(health[key]);
});

export default api;
