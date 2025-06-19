import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  isLoading: true,
  updateUser: () => {},
  resetSessionTimeout: () => {},
});

export const useAuth = () => useContext(AuthContext);

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Clear session timeout
  const clearSessionTimeout = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  }, []);

  // Define logout first since it's used by other functions
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    clearSessionTimeout();
    navigate("/login");
  }, [navigate, clearSessionTimeout]);

  // Check if token is expired
  const isTokenExpired = useCallback((token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      if (!decoded.exp) return true;
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      console.error("Error decoding token:", error);
      return true;
    }
  }, []);

  // Set up session timeout
  const setupSessionTimeout = useCallback(() => {
    clearSessionTimeout();

    sessionTimeoutRef.current = setTimeout(() => {
      logout();
    }, SESSION_DURATION);
  }, [clearSessionTimeout, logout]);

  const login = useCallback(
    (newToken, userData) => {
      try {
        // Verify token can be decoded before storing
        const decoded = jwtDecode(newToken);
        if (!decoded.exp || !decoded.sub) {
          throw new Error("Invalid token format");
        }

        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        setupSessionTimeout();
      } catch (error) {
        console.error("Login error:", error);
        logout();
      }
    },
    [setupSessionTimeout, logout],
  );

  const updateUser = useCallback((userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          // Verify token can be decoded
          const decoded = jwtDecode(storedToken);
          if (!decoded.exp || !decoded.sub) {
            throw new Error("Invalid token format");
          }

          if (!isTokenExpired(storedToken)) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setupSessionTimeout();
          } else {
            throw new Error("Token expired");
          }
        } else {
          // Temporary: Auto-login as admin for dashboard development
          const tempAdminUser = {
            id: 1,
            username: "admin",
            email: "admin@example.com",
            role: "admin",
          };
          const tempToken = "temp-admin-token-for-development";

          setUser(tempAdminUser);
          setToken(tempToken);
          localStorage.setItem("user", JSON.stringify(tempAdminUser));
          localStorage.setItem("token", tempToken);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Temporary: Auto-login as admin on error
        const tempAdminUser = {
          id: 1,
          username: "admin",
          email: "admin@example.com",
          role: "admin",
        };
        const tempToken = "temp-admin-token-for-development";

        setUser(tempAdminUser);
        setToken(tempToken);
        localStorage.setItem("user", JSON.stringify(tempAdminUser));
        localStorage.setItem("token", tempToken);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return clearSessionTimeout;
  }, [isTokenExpired, setupSessionTimeout, logout, clearSessionTimeout]);

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isLoading,
    updateUser,
    resetSessionTimeout: setupSessionTimeout,
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
