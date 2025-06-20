import mysql from "mysql2/promise";
import { logger } from "./middleware/logger.js";
import dotenv from "dotenv";

dotenv.config();

// Check if running in development mode without database
const isDevModeNoDB = process.env.DEV_MODE_NO_DB === "true";

const poolConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "management",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  multipleStatements: true,
  idleTimeout: 300000,
  // Additional MySQL options for better reliability
  charset: "utf8mb4",
  timezone: "+00:00",
  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized: false,
        }
      : false,
};

if (isDevModeNoDB) {
  logger.warn("⚠️  RUNNING IN DEVELOPMENT MODE WITHOUT DATABASE");
  logger.warn("💡 Database operations will be mocked");
  logger.warn(
    "🔧 To use real database, set DEV_MODE_NO_DB=false in .env and ensure MySQL is running",
  );
}

logger.info(
  `Creating MySQL connection pool for ${poolConfig.host}:${poolConfig.port} (database: ${poolConfig.database})`,
);

const pool = isDevModeNoDB ? null : mysql.createPool(poolConfig);

// Database connection state
let dbConnected = false;
let lastConnectionTest = 0;
const CONNECTION_TEST_INTERVAL = 30000; // 30 seconds

// Execute a query with comprehensive error handling and retry logic
const executeQuery = async (sql, params = [], retryCount = 0) => {
  // Handle development mode without database
  if (isDevModeNoDB) {
    logger.info(
      `Mock query executed: ${sql.substring(0, 100)}${sql.length > 100 ? "..." : ""}`,
    );

    // Return mock data based on query type
    if (sql.toLowerCase().includes("select")) {
      return []; // Return empty result set
    } else if (sql.toLowerCase().includes("insert")) {
      return { insertId: Math.floor(Math.random() * 1000), affectedRows: 1 };
    } else if (
      sql.toLowerCase().includes("update") ||
      sql.toLowerCase().includes("delete")
    ) {
      return { affectedRows: 1, changedRows: 1 };
    }
    return { affectedRows: 1 };
  }

  const maxRetries = 3;
  let connection;

  try {
    // Test connection periodically
    const now = Date.now();
    if (!dbConnected || now - lastConnectionTest > CONNECTION_TEST_INTERVAL) {
      await testConnection();
      lastConnectionTest = now;
    }

    connection = await pool.getConnection();
    const [results] = await connection.execute(sql, params);

    // Log successful query in development
    if (process.env.NODE_ENV === "development") {
      logger.info(
        `Query executed successfully: ${sql.substring(0, 100)}${sql.length > 100 ? "..." : ""}`,
      );
    }

    return results;
  } catch (error) {
    logger.error("Query execution error:", {
      error: error.message,
      code: error.code,
      sql: sql.substring(0, 200),
      params: params,
    });

    // Handle specific MySQL errors
    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ENOTFOUND" ||
      error.code === "ETIMEDOUT"
    ) {
      dbConnected = false;

      if (retryCount < maxRetries) {
        logger.warn(
          `Database connection failed, retrying... (${retryCount + 1}/${maxRetries})`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1)),
        ); // Exponential backoff
        return executeQuery(sql, params, retryCount + 1);
      }
    }

    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Execute multiple queries in a transaction
const executeTransaction = async (queries) => {
  // Handle development mode without database
  if (isDevModeNoDB) {
    logger.info(`Mock transaction executed with ${queries.length} queries`);
    const results = [];
    for (const { sql } of queries) {
      if (sql.toLowerCase().includes("insert")) {
        results.push({
          insertId: Math.floor(Math.random() * 1000),
          affectedRows: 1,
        });
      } else {
        results.push({ affectedRows: 1 });
      }
    }
    return results;
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const results = [];
    for (const { sql, params } of queries) {
      const [result] = await connection.execute(sql, params || []);
      results.push(result);
    }

    await connection.commit();
    logger.info(
      `Transaction completed successfully with ${queries.length} queries`,
    );
    return results;
  } catch (error) {
    if (connection) {
      await connection.rollback();
      logger.error("Transaction rolled back due to error:", error);
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.query("SELECT 1 as test");
    connection.release();

    if (!dbConnected) {
      logger.info("MySQL database connection established successfully");
      dbConnected = true;
    }

    return true;
  } catch (error) {
    dbConnected = false;
    logger.error("MySQL database connection test failed:", {
      error: error.message,
      code: error.code,
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
    });

    // Provide helpful error messages
    if (error.code === "ECONNREFUSED") {
      logger.error("Connection refused. Please check:");
      logger.error("1. MySQL server is running");
      logger.error("2. MySQL is listening on the correct port");
      logger.error("3. Firewall settings allow the connection");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      logger.error("Access denied. Please check:");
      logger.error("1. Username and password are correct");
      logger.error("2. User has proper privileges for the database");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      logger.error(
        "Database does not exist. Please create the database first:",
      );
      logger.error(`CREATE DATABASE ${poolConfig.database};`);
    }

    return false;
  }
};

// Get database connection status
const isConnected = () => dbConnected;

// Close all connections gracefully
const closePool = async () => {
  try {
    await pool.end();
    logger.info("Database connection pool closed");
  } catch (error) {
    logger.error("Error closing database pool:", error);
  }
};

// Initialize database connection on startup
(async () => {
  logger.info("Initializing database connection...");
  await testConnection();

  // Set up periodic connection health checks
  setInterval(async () => {
    try {
      await testConnection();
    } catch (error) {
      logger.error("Periodic connection test failed:", error.message);
    }
  }, CONNECTION_TEST_INTERVAL);
})();

// Handle process termination
process.on("SIGINT", async () => {
  logger.info("SIGINT received, closing database connections...");
  await closePool();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, closing database connections...");
  await closePool();
  process.exit(0);
});

export {
  pool as default,
  executeQuery,
  executeTransaction,
  testConnection,
  isConnected,
  closePool,
};
