import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { logger } from "../middleware/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initializeDatabase = async () => {
  try {
    logger.info("Starting database initialization...");

    const dbPath = path.join(__dirname, "..", "..", "database.sqlite");

    // Remove existing database file if it exists
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      logger.info("Removed existing database file");
    }

    // Create new database
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Enable foreign keys
    await db.exec("PRAGMA foreign_keys = ON;");

    // Read and execute schema
    const schemaPath = path.join(
      __dirname,
      "..",
      "database",
      "schema.sqlite.sql",
    );
    const schema = fs.readFileSync(schemaPath, "utf8");

    await db.exec(schema);

    await db.close();

    logger.info("Database initialized successfully!");
    logger.info(`Database created at: ${dbPath}`);
    logger.info("Test users created:");
    logger.info("  admin/password123 (admin)");
    logger.info("  director/password123 (director)");
    logger.info("  frontoffice/password123 (front_office)");
    logger.info("  cadet/password123 (cadet)");
  } catch (error) {
    logger.error("Error initializing database:", error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export default initializeDatabase;
