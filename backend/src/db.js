import mysql from "mysql2/promise";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { logger } from "./middleware/logger.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool;
let dbType = "mysql";

// Initialize database connection with smart fallback
const initializeDatabase = async () => {
  // Try MySQL first if password is provided
  if (process.env.DB_PASSWORD) {
    try {
      const poolConfig = {
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || "management",
        port: parseInt(process.env.DB_PORT || "3306", 10),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        multipleStatements: true,
      };

      logger.info(
        `Attempting MySQL connection at ${poolConfig.host}:${poolConfig.port} as ${poolConfig.user}`,
      );
      pool = mysql.createPool(poolConfig);

      // Test the connection
      const connection = await pool.getConnection();
      await connection.query("SELECT 1");
      connection.release();

      logger.info("✅ MySQL database connection successful");
      dbType = "mysql";
      return;
    } catch (error) {
      logger.warn(`MySQL connection failed: ${error.message}`);
      logger.info("Falling back to SQLite for development...");
    }
  }

  // Fallback to SQLite
  const dbPath = path.join(__dirname, "..", "database.sqlite");

  pool = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await pool.exec("PRAGMA foreign_keys = ON;");

  // Check if database needs initialization
  const tables = await pool.all(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
  );
  if (tables.length === 0) {
    logger.info("Initializing SQLite database with schema...");
    const schemaPath = path.join(__dirname, "database", "schema.sqlite.sql");
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, "utf8");
      await pool.exec(schema);
    }
  }

  logger.info("✅ SQLite database connection successful (development mode)");
  dbType = "sqlite";
};

// Initialize the database
await initializeDatabase();

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

// Test the connection (already done during initialization)
logger.info(`Database type: ${dbType}`);
logger.info("Database connection initialized successfully");

export { pool as default, executeQuery };
