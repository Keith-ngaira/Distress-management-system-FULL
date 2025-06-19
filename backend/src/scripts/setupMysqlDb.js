import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "../middleware/logger.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupMysqlDatabase = async () => {
  let connection;

  try {
    logger.info("Starting MySQL database setup...");

    // First, connect without specifying database to create it
    const connectionConfig = {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      port: parseInt(process.env.DB_PORT || "3306", 10),
      multipleStatements: true,
    };

    connection = await mysql.createConnection(connectionConfig);

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || "distress_management";
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    logger.info(`Database '${dbName}' created or already exists`);

    // Use the database
    await connection.execute(`USE \`${dbName}\``);

    // Read and execute schema
    const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Split the schema into individual statements
    const statements = schema
      .split(";")
      .filter((statement) => statement.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }

    logger.info("Database schema created successfully!");
    logger.info("Test users created:");
    logger.info("  admin/password123 (admin)");
    logger.info("  director/password123 (director)");
    logger.info("  frontoffice/password123 (front_office)");
    logger.info("  cadet/password123 (cadet)");
  } catch (error) {
    logger.error("Error setting up MySQL database:", error);

    if (error.code === "ECONNREFUSED") {
      logger.error(
        "MySQL connection refused. Please ensure MySQL server is running.",
      );
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      logger.error(
        "Access denied. Please check your MySQL credentials in .env file.",
      );
    } else if (error.code === "ER_BAD_DB_ERROR") {
      logger.error("Database does not exist and could not be created.");
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMysqlDatabase();
}

export default setupMysqlDatabase;
