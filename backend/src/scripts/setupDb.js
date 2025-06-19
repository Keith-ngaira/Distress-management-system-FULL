import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "../middleware/logger.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupDatabase = async () => {
  let connection;

  try {
    logger.info("Starting database setup...");

    // Connect to MySQL server
    const connectionConfig = {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      port: parseInt(process.env.DB_PORT || "3306", 10),
      multipleStatements: true,
    };

    logger.info(
      `Connecting to MySQL at ${connectionConfig.host}:${connectionConfig.port} as ${connectionConfig.user}`,
    );

    connection = await mysql.createConnection(connectionConfig);
    logger.info("Connected to MySQL server successfully");

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || "management";
    logger.info(`Creating database: ${dbName}`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    logger.info(`Database '${dbName}' created or already exists`);

    // Use the database
    await connection.execute(`USE \`${dbName}\``);

    // Read and execute schema
    const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    logger.info("Executing database schema...");

    // Split the schema into individual statements and execute them
    const statements = schema
      .split(";")
      .filter((statement) => statement.trim().length > 0);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await connection.execute(statement);
          logger.info(`Executed statement ${i + 1}/${statements.length}`);
        } catch (error) {
          // Log but continue with next statement (for INSERT statements that might already exist)
          if (error.code !== "ER_DUP_ENTRY") {
            logger.warn(`Warning on statement ${i + 1}: ${error.message}`);
          }
        }
      }
    }

    // Test with a simple query
    const [result] = await connection.execute(
      "SELECT COUNT(*) as user_count FROM users",
    );
    logger.info(
      `Database setup completed! Found ${result[0].user_count} users in the system.`,
    );

    logger.info("Test users available:");
    logger.info("  admin/admin123 (admin)");
    logger.info("  director/director123 (director)");
    logger.info("  frontoffice/frontoffice123 (front_office)");
    logger.info("  cadet/cadet123 (cadet)");
  } catch (error) {
    logger.error("Error setting up database:", error);

    if (error.code === "ECONNREFUSED") {
      logger.error("Connection refused. Please ensure:");
      logger.error("1. MySQL server is running");
      logger.error("2. MySQL is listening on port 3306");
      logger.error("3. Check your MySQL service status");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      logger.error("Access denied. Please check:");
      logger.error("1. Username and password in .env file");
      logger.error("2. User has sufficient privileges");
    }

    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase().catch(() => process.exit(1));
}

export default setupDatabase;
