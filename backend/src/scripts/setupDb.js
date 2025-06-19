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

    // Read and execute the complete schema (includes database creation)
    const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    logger.info("Executing complete database schema...");

    // Execute the complete schema (which includes database creation and table setup)
    await connection.query(schema);

    logger.info("✅ Database setup completed successfully!");
    logger.info("📋 Test users created with credentials:");
    logger.info("  👤 admin/admin123 (admin role)");
    logger.info("  👤 director/director123 (director role)");
    logger.info("  👤 frontoffice/frontoffice123 (front_office role)");
    logger.info("  👤 cadet/cadet123 (cadet role)");

    // Verify setup by checking user count
    const dbName = process.env.DB_NAME || "management";
    await connection.execute(`USE \`${dbName}\``);
    const [result] = await connection.execute(
      "SELECT COUNT(*) as user_count FROM users",
    );
    logger.info(
      `✅ Verification: Found ${result[0].user_count} users in the database`,
    );
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
