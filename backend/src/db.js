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

// Initialize MySQL database connection
const initializeDatabase = async () => {
  const poolConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "management",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true,
  };

  logger.info(
    `Connecting to MySQL at ${poolConfig.host}:${poolConfig.port} as ${poolConfig.user}`,
  );
  pool = mysql.createPool(poolConfig);

  try {
    // Test the connection
    const connection = await pool.getConnection();
    await connection.query("SELECT 1");
    connection.release();

    logger.info("MySQL database connection successful");
    dbType = "mysql";
  } catch (error) {
    logger.error("MySQL connection failed:", error.message);
    if (error.code === "ECONNREFUSED") {
      logger.error(
        "Connection refused. Please ensure MySQL server is running.",
      );
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      logger.error("Access denied. Please check your MySQL credentials.");
    }
    throw error;
  }
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
