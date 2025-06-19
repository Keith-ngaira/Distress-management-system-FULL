import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout/Layout";
import ErrorFallback from "./components/ErrorFallback";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import CssBaseline from "@mui/material/CssBaseline";
import PermissionRoute from "./components/PermissionRoute";
import Login from "./pages/Login/Login";

// Lazy load components for better performance
const Dashboard = React.lazy(() => import("./pages/Dashboard/Dashboard"));
const DistressMessageList = React.lazy(
  () => import("./pages/DistressMessages/DistressMessageList"),
);
const DistressMessageDetail = React.lazy(
  () => import("./pages/DistressMessages/DistressMessageDetail"),
);
const CreateDistressMessage = React.lazy(
  () => import("./pages/DistressMessages/CreateDistressMessage"),
);
const EditDistressMessage = React.lazy(
  () => import("./pages/DistressMessages/EditDistressMessage"),
);
const Profile = React.lazy(() => import("./pages/Profile/Profile"));
const UserManagement = React.lazy(() => import("./pages/Admin/UserManagement"));

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading component
const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
);

const AppContent = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PermissionRoute>
              <Layout />
            </PermissionRoute>
          }
        >
          <Route
            index
            element={
              <PermissionRoute resource="dashboard" action="view_dashboard">
                <Dashboard />
              </PermissionRoute>
            }
          />
          <Route path="messages">
            <Route
              index
              element={
                <PermissionRoute resource="distress_messages" action="read">
                  <DistressMessageList />
                </PermissionRoute>
              }
            />
            <Route
              path="create"
              element={
                <PermissionRoute resource="distress_messages" action="create">
                  <CreateDistressMessage />
                </PermissionRoute>
              }
            />
            <Route
              path=":id"
              element={
                <PermissionRoute resource="distress_messages" action="read">
                  <DistressMessageDetail />
                </PermissionRoute>
              }
            />
            <Route
              path=":id/edit"
              element={
                <PermissionRoute resource="distress_messages" action="update">
                  <EditDistressMessage />
                </PermissionRoute>
              }
            />
          </Route>
          <Route
            path="profile"
            element={
              <PermissionRoute resource="profile" action="view">
                <Profile />
              </PermissionRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <PermissionRoute resource="users" action="manage">
                <UserManagement />
              </PermissionRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <ThemeProvider>
            <AuthProvider>
              <CssBaseline />
              <AppContent />
            </AuthProvider>
          </ThemeProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
