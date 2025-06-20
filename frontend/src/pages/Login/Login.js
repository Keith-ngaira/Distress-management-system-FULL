import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  useTheme,
  IconButton,
  Fade,
  Slide,
  Zoom,
  CircularProgress,
  alpha,
  keyframes,
  styled,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  PersonOutlined,
  SecurityOutlined,
  AdminPanelSettingsOutlined,
  EngineeringOutlined,
  SupportAgentOutlined,
  SchoolOutlined,
} from "@mui/icons-material";
import { auth } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

// Animated background particles
const particleFloat = keyframes`
    0% { transform: translateY(0px) rotate(0deg); opacity: 1; }
    33% { transform: translateY(-30px) rotate(120deg); opacity: 0.8; }
    66% { transform: translateY(30px) rotate(240deg); opacity: 0.6; }
    100% { transform: translateY(0px) rotate(360deg); opacity: 1; }
`;

const glowPulse = keyframes`
    0% { box-shadow: 0 0 20px rgba(33, 150, 243, 0.3); }
    50% { box-shadow: 0 0 40px rgba(33, 150, 243, 0.6), 0 0 80px rgba(33, 150, 243, 0.2); }
    100% { box-shadow: 0 0 20px rgba(33, 150, 243, 0.3); }
`;

const shimmer = keyframes`
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
`;

const FloatingParticle = styled(Box)(({ theme, delay = 0, size = 4 }) => ({
  position: "absolute",
  width: size,
  height: size,
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  borderRadius: "50%",
  animation: `${particleFloat} ${4 + Math.random() * 2}s ease-in-out infinite`,
  animationDelay: `${delay}s`,
  opacity: 0.6,
}));

const GlassmorphismPaper = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, 
        ${alpha(theme.palette.background.paper, 0.9)} 0%, 
        ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
  backdropFilter: "blur(20px)",
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: 20,
  boxShadow: `
        0 8px 32px 0 ${alpha(theme.palette.primary.main, 0.15)},
        inset 0 1px 0 ${alpha("#ffffff", 0.1)}
    `,
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "2px",
    background: `linear-gradient(90deg, 
            transparent, 
            ${theme.palette.primary.main}, 
            ${theme.palette.secondary.main}, 
            transparent)`,
    animation: `${shimmer} 3s ease-in-out infinite`,
  },
}));

const FuturisticTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    background: `linear-gradient(135deg, 
            ${alpha(theme.palette.background.paper, 0.8)} 0%, 
            ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
    backdropFilter: "blur(10px)",
    borderRadius: 12,
    transition: "all 0.3s ease",
    "& fieldset": {
      borderColor: alpha(theme.palette.primary.main, 0.3),
      borderWidth: 1,
    },
    "&:hover fieldset": {
      borderColor: alpha(theme.palette.primary.main, 0.6),
      boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
      boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.3)}`,
    },
  },
  "& .MuiInputLabel-root": {
    color: theme.palette.text.secondary,
    "&.Mui-focused": {
      color: theme.palette.primary.main,
    },
  },
}));

const FuturisticButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: "12px 32px",
  fontWeight: 600,
  fontSize: "1.1rem",
  textTransform: "none",
  background: `linear-gradient(135deg, 
        ${theme.palette.primary.main} 0%, 
        ${theme.palette.primary.dark} 100%)`,
  boxShadow: `
        0 4px 20px ${alpha(theme.palette.primary.main, 0.3)},
        inset 0 1px 0 ${alpha("#ffffff", 0.2)}
    `,
  transition: "all 0.3s ease",
  position: "relative",
  overflow: "hidden",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: `
            0 8px 30px ${alpha(theme.palette.primary.main, 0.4)},
            inset 0 1px 0 ${alpha("#ffffff", 0.2)}
        `,
    background: `linear-gradient(135deg, 
            ${theme.palette.primary.light} 0%, 
            ${theme.palette.primary.main} 100%)`,
  },
  "&:disabled": {
    background: alpha(theme.palette.action.disabled, 0.3),
    color: theme.palette.action.disabled,
  },
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: "-100%",
    width: "100%",
    height: "100%",
    background: `linear-gradient(90deg, 
            transparent, 
            ${alpha("#ffffff", 0.2)}, 
            transparent)`,
    transition: "left 0.5s ease",
  },
  "&:hover::before": {
    left: "100%",
  },
}));

const RoleIcon = styled(Box)(({ theme, active }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  borderRadius: "50%",
  background: active
    ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
    : alpha(theme.palette.action.hover, 0.1),
  color: active ? "#ffffff" : theme.palette.text.secondary,
  transition: "all 0.3s ease",
  cursor: "pointer",
  border: `2px solid ${active ? theme.palette.primary.main : "transparent"}`,
  animation: active ? `${glowPulse} 2s ease-in-out infinite` : "none",
  "&:hover": {
    transform: "scale(1.1)",
    background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
  },
}));

const BackgroundContainer = styled(Box)(({ theme }) => ({
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: `radial-gradient(circle at 20% 80%, 
        ${alpha(theme.palette.primary.main, 0.15)} 0%, 
        transparent 50%),
        radial-gradient(circle at 80% 20%, 
        ${alpha(theme.palette.secondary.main, 0.15)} 0%, 
        transparent 50%),
        radial-gradient(circle at 40% 40%, 
        ${alpha(theme.palette.info.main, 0.1)} 0%, 
        transparent 50%),
        linear-gradient(135deg, 
        ${theme.palette.background.default} 0%, 
        ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
  zIndex: -2,
}));

const GridOverlay = styled(Box)(({ theme }) => ({
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundImage: `
        linear-gradient(${alpha(theme.palette.primary.main, 0.1)} 1px, transparent 1px),
        linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)} 1px, transparent 1px)
    `,
  backgroundSize: "50px 50px",
  zIndex: -1,
  opacity: 0.3,
}));

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    setMounted(true);
    // Auto-detect role based on username for demo purposes
    const roleMap = {
      admin: "admin",
      director: "director",
      frontoffice: "front_office",
      cadet: "cadet",
    };
    setSelectedRole(roleMap[username] || null);
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await auth.login(username, password);
      authLogin(response.data.token, response.data.user);

      // Add success animation delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to login";
      setError(errorMessage);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getRoleIcon = (role) => {
    const icons = {
      admin: AdminPanelSettingsOutlined,
      director: EngineeringOutlined,
      front_office: SupportAgentOutlined,
      cadet: SchoolOutlined,
    };
    return icons[role] || PersonOutlined;
  };

  const particles = Array.from({ length: 15 }, (_, i) => (
    <FloatingParticle
      key={i}
      delay={Math.random() * 5}
      size={Math.random() * 6 + 2}
      sx={{
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
      }}
    />
  ));

  return (
    <>
      <BackgroundContainer />
      <GridOverlay />
      {particles}

      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="sm">
          <Fade in={mounted} timeout={1000}>
            <Box>
              <Slide direction="down" in={mounted} timeout={800}>
                <Box sx={{ textAlign: "center", mb: 4 }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, 
                                                ${theme.palette.primary.main}, 
                                                ${theme.palette.secondary.main})`,
                      mb: 2,
                      animation: `${glowPulse} 3s ease-in-out infinite`,
                    }}
                  >
                    <SecurityOutlined sx={{ fontSize: 40, color: "white" }} />
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      background: `linear-gradient(135deg, 
                                                ${theme.palette.primary.main}, 
                                                ${theme.palette.secondary.main})`,
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      mb: 1,
                    }}
                  >
                    Distress Management
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 300,
                    }}
                  >
                    Secure Command Center Access
                  </Typography>
                </Box>
              </Slide>

              <Zoom in={mounted} timeout={1200}>
                <GlassmorphismPaper
                  elevation={0}
                  sx={{
                    p: { xs: 3, sm: 4 },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {error && (
                    <Slide direction="down" in={!!error} timeout={300}>
                      <Alert
                        severity="error"
                        sx={{
                          width: "100%",
                          mb: 3,
                          borderRadius: 2,
                          background: alpha(theme.palette.error.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                        }}
                      >
                        {error}
                      </Alert>
                    </Slide>
                  )}

                  {/* Role Indicators */}
                  {selectedRole && (
                    <Fade in={!!selectedRole} timeout={500}>
                      <Box sx={{ mb: 3, textAlign: "center" }}>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ mb: 1, display: "block" }}
                        >
                          Detected Role
                        </Typography>
                        <RoleIcon active={true}>
                          {React.createElement(getRoleIcon(selectedRole), {
                            fontSize: "small",
                          })}
                        </RoleIcon>
                        <Typography
                          variant="caption"
                          sx={{
                            mt: 1,
                            display: "block",
                            textTransform: "capitalize",
                          }}
                        >
                          {selectedRole.replace("_", " ")}
                        </Typography>
                      </Box>
                    </Fade>
                  )}

                  <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ width: "100%" }}
                  >
                    <Stack spacing={3}>
                      <FuturisticTextField
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                        fullWidth
                        autoFocus
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <PersonOutlined
                              sx={{
                                mr: 1,
                                color: theme.palette.text.secondary,
                              }}
                            />
                          ),
                        }}
                      />

                      <FuturisticTextField
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        fullWidth
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <LockOutlined
                              sx={{
                                mr: 1,
                                color: theme.palette.text.secondary,
                              }}
                            />
                          ),
                          endAdornment: (
                            <IconButton
                              onClick={togglePasswordVisibility}
                              edge="end"
                              sx={{
                                color: theme.palette.text.secondary,
                                "&:hover": {
                                  color: theme.palette.primary.main,
                                },
                              }}
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          ),
                        }}
                      />

                      <FuturisticButton
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={loading}
                        sx={{ mt: 2 }}
                      >
                        {loading ? (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <CircularProgress size={20} color="inherit" />
                            Authenticating...
                          </Box>
                        ) : (
                          "Access Command Center"
                        )}
                      </FuturisticButton>
                    </Stack>
                  </Box>

                  {/* Demo Credentials */}
                  <Box sx={{ mt: 4, textAlign: "center" }}>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ mb: 2, display: "block" }}
                    >
                      Demo Credentials
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="center"
                      flexWrap="wrap"
                      sx={{ gap: 1 }}
                    >
                      {[
                        { role: "admin", icon: AdminPanelSettingsOutlined },
                        { role: "director", icon: EngineeringOutlined },
                        { role: "frontoffice", icon: SupportAgentOutlined },
                        { role: "cadet", icon: SchoolOutlined },
                      ].map(({ role, icon: Icon }) => (
                        <Button
                          key={role}
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setUsername(role);
                            setPassword(`${role}123`);
                            setSelectedRole(
                              role === "frontoffice" ? "front_office" : role,
                            );
                          }}
                          sx={{
                            borderRadius: 2,
                            px: 2,
                            py: 0.5,
                            background: alpha(
                              theme.palette.background.paper,
                              0.5,
                            ),
                            backdropFilter: "blur(10px)",
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                            color: theme.palette.text.secondary,
                            fontSize: "0.75rem",
                            textTransform: "capitalize",
                            "&:hover": {
                              background: alpha(
                                theme.palette.primary.main,
                                0.1,
                              ),
                              borderColor: theme.palette.primary.main,
                              transform: "translateY(-1px)",
                            },
                          }}
                          startIcon={<Icon sx={{ fontSize: 16 }} />}
                        >
                          {role}
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                </GlassmorphismPaper>
              </Zoom>
            </Box>
          </Fade>
        </Container>
      </Box>
    </>
  );
};

export default Login;
