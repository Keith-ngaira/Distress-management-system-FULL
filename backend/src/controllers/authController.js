import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { executeQuery, isConnected } from "../db.js";
import { logger } from "../middleware/logger.js";
import { findUserByUsername } from "./mockData.js";
import { updateLastLogin } from "./userController.js";

// User login
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    let user;
    let usingFallback = false;

    if (!isConnected()) {
      logger.warn("Database not connected, using mock data for authentication");
      user = findUserByUsername(username);
      usingFallback = true;
    } else {
      // Get user from database
      const users = await executeQuery(
        `
                SELECT
                    id,
                    username,
                    password,
                    email,
                    role,
                    is_active,
                    last_login,
                    created_at
                FROM users
                WHERE username = ? AND is_active = 1
            `,
        [username],
      );

      user = users[0];
    }

    if (!user) {
      logger.warn(`Login attempt failed: User not found - ${username}`);
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Check if user is active
    if (!user.is_active) {
      logger.warn(`Login attempt failed: User account disabled - ${username}`);
      return res.status(401).json({
        success: false,
        message: "Account is disabled. Please contact administrator.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Login attempt failed: Invalid password - ${username}`);
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Update last login timestamp (non-blocking)
    if (!usingFallback) {
      updateLastLogin(user.id).catch((error) => {
        logger.error("Error updating last login:", error);
      });
    }

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "24h",
      issuer: "distress-management-system",
      audience: "distress-management-users",
    });

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    // Log successful login
    logger.info(
      `Successful login: ${username} (${user.role})${usingFallback ? " [FALLBACK]" : ""}`,
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: userWithoutPassword,
      },
      fallback: usingFallback,
    });
  } catch (error) {
    logger.error("Login error:", error);

    // Try fallback authentication if database error
    if (isConnected()) {
      logger.warn(
        "Database error during login, attempting fallback authentication",
      );
      try {
        const user = findUserByUsername(req.body.username);
        if (user && (await bcrypt.compare(req.body.password, user.password))) {
          const tokenPayload = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          };

          const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
            expiresIn: "24h",
          });

          const { password: _, ...userWithoutPassword } = user;

          return res.json({
            success: true,
            message: "Login successful (fallback)",
            data: {
              token,
              user: userWithoutPassword,
            },
            fallback: true,
          });
        }
      } catch (fallbackError) {
        logger.error("Fallback authentication also failed:", fallbackError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    let user;
    let usingFallback = false;

    if (!isConnected()) {
      logger.warn(
        "Database not connected, using mock data for password change",
      );
      // For mock data, we'll just simulate the operation
      usingFallback = true;
      user = {
        id: userId,
        password:
          "$2b$10$NKxDv2xBS3.Pc0mMHlATQuMi.auxS0Gaoers5FqPFtqejiNRK/OYm",
      }; // admin123 hash
    } else {
      // Get current user from database
      const users = await executeQuery(
        `
                SELECT id, password
                FROM users
                WHERE id = ? AND is_active = 1
            `,
        [userId],
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user = users[0];
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      logger.warn(
        `Password change failed: Invalid current password - User ID: ${userId}`,
      );
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    if (!usingFallback) {
      // Update password in database
      await executeQuery(
        `
                UPDATE users
                SET password = ?, updated_at = NOW()
                WHERE id = ?
            `,
        [hashedNewPassword, userId],
      );
    }

    logger.info(
      `Password changed successfully for user ID: ${userId}${usingFallback ? " [FALLBACK]" : ""}`,
    );

    res.json({
      success: true,
      message: "Password changed successfully",
      fallback: usingFallback,
    });
  } catch (error) {
    logger.error("Password change error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during password change",
    });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Verify current token (even if expired)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        // Token is expired, but we can still decode it to get user info
        decoded = jwt.decode(token);
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    let user;
    let usingFallback = false;

    if (!isConnected()) {
      logger.warn("Database not connected, using mock data for token refresh");
      user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        is_active: true,
      };
      usingFallback = true;
    } else {
      // Get user from database to ensure they still exist and are active
      const users = await executeQuery(
        `
                SELECT
                    id,
                    username,
                    email,
                    role,
                    is_active
                FROM users
                WHERE id = ? AND is_active = 1
            `,
        [decoded.id],
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: "User not found or inactive",
        });
      }

      user = users[0];
    }

    // Generate new token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const newToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "24h",
      issuer: "distress-management-system",
      audience: "distress-management-users",
    });

    logger.info(
      `Token refreshed for user: ${user.username}${usingFallback ? " [FALLBACK]" : ""}`,
    );

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        token: newToken,
        user,
      },
      fallback: usingFallback,
    });
  } catch (error) {
    logger.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during token refresh",
    });
  }
};

// Logout user (token blacklisting would be implemented here in production)
export const logoutUser = async (req, res) => {
  try {
    // In a production environment, you would typically:
    // 1. Add the token to a blacklist/revocation list
    // 2. Store revoked tokens in Redis or database
    // 3. Check blacklist in the authentication middleware

    const userId = req.user?.id;
    const username = req.user?.username;

    // Log the logout event
    if (userId && username) {
      logger.info(`User logged out: ${username} (ID: ${userId})`);

      // Optionally log to audit table if database is available
      if (isConnected()) {
        try {
          await executeQuery(
            `
                        INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, created_at)
                        VALUES (?, 'logout', 'user', ?, NOW())
                    `,
            [userId, userId],
          );
        } catch (auditError) {
          logger.error("Error logging logout to audit table:", auditError);
          // Don't fail the logout for audit errors
        }
      }
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during logout",
    });
  }
};

// Verify token endpoint (for frontend to check token validity)
export const verifyToken = async (req, res) => {
  try {
    // If we reach here, the token is valid (verified by auth middleware)
    const user = req.user;

    // Optionally verify user still exists and is active in database
    if (isConnected()) {
      const users = await executeQuery(
        `
                SELECT is_active
                FROM users
                WHERE id = ?
            `,
        [user.id],
      );

      if (users.length === 0 || !users[0].is_active) {
        return res.status(401).json({
          success: false,
          message: "User account not found or inactive",
        });
      }
    }

    res.json({
      success: true,
      message: "Token is valid",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    logger.error("Token verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during token verification",
    });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let user;
    let usingFallback = false;

    if (!isConnected()) {
      logger.warn("Database not connected, using token data for profile");
      user = req.user;
      usingFallback = true;
    } else {
      // Get fresh user data from database
      const users = await executeQuery(
        `
                SELECT
                    id,
                    username,
                    email,
                    role,
                    is_active,
                    last_login,
                    created_at,
                    updated_at
                FROM users
                WHERE id = ?
            `,
        [userId],
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User profile not found",
        });
      }

      user = users[0];
    }

    logger.info(
      `Profile accessed by user: ${user.username}${usingFallback ? " [FALLBACK]" : ""}`,
    );

    res.json({
      success: true,
      data: user,
      fallback: usingFallback,
    });
  } catch (error) {
    logger.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching profile",
    });
  }
};
