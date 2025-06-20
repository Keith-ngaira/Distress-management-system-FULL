import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  console.log("🚀 Starting database setup...");

  try {
    // First, connect without specifying a database to create it
    console.log("📡 Connecting to MySQL server...");
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      port: parseInt(process.env.DB_PORT || "3306", 10),
      multipleStatements: true,
    });

    console.log("✅ Connected to MySQL server successfully!");

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || "management";
    console.log(`🗄️  Creating database '${dbName}' if it doesn't exist...`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.execute(`USE \`${dbName}\``);
    console.log(`✅ Database '${dbName}' ready!`);

    // Read and execute schema
    console.log("📋 Loading database schema...");
    const schemaPath = path.join(__dirname, "src", "database", "schema.sql");

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, "utf8");
    console.log("🔧 Executing schema...");

    // Split schema into individual statements and execute them
    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter(
        (stmt) =>
          stmt.length > 0 && !stmt.startsWith("--") && !stmt.startsWith("/*"),
      );

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
        } catch (error) {
          if (!error.message.includes("already exists")) {
            console.warn(`⚠️  Warning executing statement: ${error.message}`);
          }
        }
      }
    }

    console.log("✅ Database schema executed successfully!");

    // Verify tables were created
    console.log("🔍 Verifying database structure...");
    const [tables] = await connection.execute("SHOW TABLES");
    console.log("📋 Created tables:");
    tables.forEach((table) => {
      const tableName = Object.values(table)[0];
      console.log(`   ✓ ${tableName}`);
    });

    // Check if we have any users
    const [users] = await connection.execute(
      "SELECT COUNT(*) as count FROM users",
    );
    const userCount = users[0].count;
    console.log(`👥 Current user count: ${userCount}`);

    if (userCount === 0) {
      console.log("👤 No users found, creating default admin user...");
      // Create default admin user (password: admin123)
      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash("admin123", 10);

      await connection.execute(
        `
                INSERT INTO users (username, password, email, role, is_active) 
                VALUES ('admin', ?, 'admin@distressmanagement.com', 'admin', TRUE)
            `,
        [hashedPassword],
      );

      console.log("✅ Default admin user created:");
      console.log("   Username: admin");
      console.log("   Password: admin123");
      console.log("   Email: admin@distressmanagement.com");
    }

    // Test a basic query
    console.log("🧪 Testing database connectivity...");
    const [testResult] = await connection.execute(
      "SELECT 1 as test, NOW() as current_time",
    );
    console.log("✅ Database test successful:", testResult[0]);

    await connection.end();
    console.log("🎉 Database setup completed successfully!");

    return true;
  } catch (error) {
    console.error("❌ Database setup failed:");
    console.error("Error:", error.message);
    console.error("Code:", error.code);

    if (error.code === "ECONNREFUSED") {
      console.error("\n💡 Troubleshooting tips:");
      console.error("1. Make sure MySQL is running:");
      console.error("   • sudo systemctl start mysql (Linux)");
      console.error("   • brew services start mysql (macOS)");
      console.error("   • Start MySQL service (Windows)");
      console.error("2. Check if MySQL is listening on the correct port:");
      console.error("   • netstat -an | grep 3306");
      console.error("3. Verify your database credentials in .env file");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("\n💡 Access denied - check your credentials:");
      console.error("1. Verify DB_USER and DB_PASSWORD in .env file");
      console.error("2. Make sure the user has proper privileges:");
      console.error("   • GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost';");
    }

    return false;
  }
}

// Run the setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Setup failed:", error);
      process.exit(1);
    });
}

export default setupDatabase;
