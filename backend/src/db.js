import mysql from "mysql2/promise";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { logger } from "./middleware/logger.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool;
let dbType = process.env.DB_TYPE || "sqlite"; // Default to SQLite for development

if (dbType === "mysql") {
  const poolConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "distress_management",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true,
    namedPlaceholders: true,
    // Add authentication plugin to handle MySQL 8+ auth
    authPlugins: {
      mysql_native_password: () => () => {
        return Buffer.from(process.env.DB_PASSWORD || "");
      },
    },
  };

  logger.info("Creating MySQL database connection pool");
  pool = mysql.createPool(poolConfig);
} else {
  // Use SQLite for development
  logger.info("Using SQLite database for development");
  const dbPath = path.join(__dirname, "..", "database.sqlite");

  pool = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Enable foreign keys
  await pool.exec("PRAGMA foreign_keys = ON;");
}

// Execute a query with error handling
const executeQuery = async (sql, params = []) => {
  try {
    if (dbType === "mysql") {
      let connection;
      try {
        connection = await pool.getConnection();
        const [results] = await connection.execute(sql, params);
        return results;
      } finally {
        if (connection) {
          connection.release();
        }
      }
    } else {
      // SQLite
      const results = await pool.all(sql, params);
      return results;
    }
  } catch (error) {
    logger.error("Query execution error:", error);
    throw error;
  }
};

// Test the connection on startup
(async () => {
  try {
    logger.info("Testing database connection");
    if (dbType === "mysql") {
      const connection = await pool.getConnection();
      await connection.query("SELECT 1");
      connection.release();
    } else {
      await pool.get("SELECT 1");
    }
    logger.info("Database connection test successful");
  } catch (error) {
    logger.error("Database connection test failed:", error);
    // Don't exit on connection failure, allow retries
    logger.info("Will retry database connection on next query");
  }
})();

export { pool as default, executeQuery };
