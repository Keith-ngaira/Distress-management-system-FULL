import axios from "axios";

// Detect if running in Builder.io proxy environment
const isBuilderProxy = window.location.hostname.includes("builder.codes");
const API_BASE_URL = isBuilderProxy
  ? "" // Use relative URL for proxy
  : process.env.REACT_APP_API_URL || "http://localhost:5556";

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
});

// Request interceptor for adding auth token
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
      });
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log("API Response:", {
        status: response.status,
        url: response.config.url,
        data: response.data,
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

// Auth endpoints
export const auth = {
  login: async (username, password) => {
    try {
      const response = await api.post("/api/auth/login", {
        username,
        password,
      });
      const { data } = response;

      // Check if response indicates success with proper data structure
      if (data?.success && data?.data?.token && data?.data?.user) {
        // Store both token and user data
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        return data;
      } else {
        // Handle error responses from server
        throw new Error(data?.message || "Invalid credentials or server error");
      }
    } catch (error) {
      // Handle network errors or server errors
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error(
          "Failed to connect to server. Please check if the backend is running.",
        );
      }
    }
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  changePassword: async (data) => {
    const response = await api.post("/api/auth/change-password", data);
    const { data: responseData } = response;
    if (!responseData?.success) {
      throw new Error(
        responseData?.message || "Invalid response format from server",
      );
    }
    return responseData;
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
  update: async (userId, userData) => {
    const response = await api.put(`/api/users/${userId}`, userData);
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },
};

// User registration
export const register = {
  create: async (username, password, email, role) => {
    const response = await api.post("/api/auth/register", {
      username,
      password,
      email,
      role,
    });
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
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
  getStatistics: async () => {
    const response = await api.get("/api/distress-messages/statistics");
    const { data } = response;
    if (!data?.success || !data?.data) {
      throw new Error(data?.message || "Invalid response format from server");
    }
    return data.data;
  },
  assign: async (id, assigneeId) => {
    const response = await api.post(`/api/distress-messages/${id}/assign`, {
      assigneeId,
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
    if (!data?.success || !data?.data?.count === undefined) {
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
  upload: async (distressMessageId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(
      `/api/attachments/${distressMessageId}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
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
    });
    return response.data;
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

// Add error boundary for API calls
const withErrorBoundary = (apiCall) => {
  return async (...args) => {
    try {
      return await apiCall(...args);
    } catch (error) {
      console.error("API Error:", error);
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

if (register && typeof register === "object") {
  Object.keys(register).forEach((key) => {
    if (typeof register[key] === "function") {
      register[key] = withErrorBoundary(register[key]);
    }
  });
}

export default api;
