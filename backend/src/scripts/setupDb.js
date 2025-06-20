import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  multipleStatements: true,
};

const databaseName = process.env.DB_NAME || "management";

console.log("🚀 Starting Distress Management System Database Setup...\n");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, colors.green);
const logWarning = (message) => log(`⚠️  ${message}`, colors.yellow);
const logError = (message) => log(`❌ ${message}`, colors.red);
const logInfo = (message) => log(`ℹ️  ${message}`, colors.blue);

async function createConnection(includeDatabase = false) {
  const config = { ...dbConfig };
  if (includeDatabase) {
    config.database = databaseName;
  }

  try {
    const connection = await mysql.createConnection(config);
    logSuccess(`Connected to MySQL at ${config.host}:${config.port}`);
    return connection;
  } catch (error) {
    logError(`Failed to connect to MySQL: ${error.message}`);
    throw error;
  }
}

async function createDatabase(connection) {
  try {
    logInfo(`Creating database '${databaseName}' if it doesn't exist...`);
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    logSuccess(`Database '${databaseName}' is ready`);
  } catch (error) {
    logError(`Failed to create database: ${error.message}`);
    throw error;
  }
}

async function runMigrations(connection) {
  logInfo("Running database migrations...\n");

  const migrations = [
    {
      name: "Create users table",
      sql: `
                CREATE TABLE IF NOT EXISTS users (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    role ENUM('admin', 'director', 'front_office', 'cadet') NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    last_login TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                    INDEX idx_username (username),
                    INDEX idx_email (email),
                    INDEX idx_role (role),
                    INDEX idx_is_active_role (is_active, role),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
            `,
    },
    {
      name: "Create distress_messages table",
      sql: `
                CREATE TABLE IF NOT EXISTS distress_messages (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    folio_number VARCHAR(50) NOT NULL UNIQUE,
                    sender_name VARCHAR(255) NOT NULL,
                    reference_number VARCHAR(100),
                    subject VARCHAR(255) NOT NULL,
                    country_of_origin VARCHAR(100) NOT NULL,
                    distressed_person_name VARCHAR(255) NOT NULL,
                    nature_of_case TEXT NOT NULL,
                    case_details TEXT,
                    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
                    status ENUM('pending', 'assigned', 'in_progress', 'resolved') DEFAULT 'pending',
                    created_by INT,
                    assigned_to INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    first_response_at TIMESTAMP NULL,
                    resolved_at TIMESTAMP NULL,
                    resolution_notes TEXT,

                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,

                    INDEX idx_folio_number (folio_number),
                    INDEX idx_reference_number (reference_number),
                    INDEX idx_status (status),
                    INDEX idx_priority (priority),
                    INDEX idx_created_at (created_at),
                    INDEX idx_assigned_to (assigned_to),
                    INDEX idx_first_response_at (first_response_at),
                    INDEX idx_resolved_at (resolved_at),
                    INDEX idx_status_priority (status, priority),
                    INDEX idx_search (sender_name, distressed_person_name, subject),
                    INDEX idx_country_date (country_of_origin, created_at)
                ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
            `,
    },
    {
      name: "Create case_updates table",
      sql: `
                CREATE TABLE IF NOT EXISTS case_updates (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    distress_message_id INT NOT NULL,
                    updated_by INT NOT NULL,
                    update_text TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                    FOREIGN KEY (distress_message_id) REFERENCES distress_messages(id) ON DELETE CASCADE,
                    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE NO ACTION,

                    INDEX idx_distress_message_id (distress_message_id),
                    INDEX idx_created_at (created_at),
                    INDEX idx_updated_by_created_at (updated_by, created_at)
                ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
            `,
    },
    {
      name: "Create case_assignments table",
      sql: `
                CREATE TABLE IF NOT EXISTS case_assignments (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    distress_message_id INT NOT NULL,
                    assigned_by INT NOT NULL,
                    assigned_to INT NOT NULL,
                    assignment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    director_instructions TEXT,
                    status ENUM('active', 'completed', 'reassigned') DEFAULT 'active',
                    completed_at TIMESTAMP NULL,
                    completion_notes TEXT,

                    FOREIGN KEY (distress_message_id) REFERENCES distress_messages(id) ON DELETE CASCADE,
                    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE NO ACTION,
                    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE NO ACTION,

                    INDEX idx_distress_message_id (distress_message_id),
                    INDEX idx_assigned_to (assigned_to),
                    INDEX idx_assigned_by (assigned_by),
                    INDEX idx_status (status),
                    INDEX idx_assignment_date (assignment_date),
                    INDEX idx_completed_at (completed_at),
                    INDEX idx_active_assignments (assigned_to, status, completed_at)
                ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
            `,
    },
    {
      name: "Create attachments table",
      sql: `
                CREATE TABLE IF NOT EXISTS attachments (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    distress_message_id INT NOT NULL,
                    file_name VARCHAR(255) NOT NULL,
                    file_path VARCHAR(255) NOT NULL,
                    file_type VARCHAR(50),
                    file_size BIGINT,
                    uploaded_by INT NOT NULL,
                    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                    FOREIGN KEY (distress_message_id) REFERENCES distress_messages(id) ON DELETE CASCADE,
                    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE NO ACTION,

                    INDEX idx_distress_message_id (distress_message_id),
                    INDEX idx_uploaded_at (uploaded_at),
                    INDEX idx_file_type (file_type),
                    INDEX idx_uploaded_by_uploaded_at (uploaded_by, uploaded_at)
                ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
            `,
    },
    {
      name: "Create notifications table",
      sql: `
                CREATE TABLE IF NOT EXISTS notifications (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    data JSON,
                    reference_type VARCHAR(50),
                    reference_id INT,
                    sound_enabled BOOLEAN DEFAULT FALSE,
                    read_at TIMESTAMP NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NULL,

                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

                    INDEX idx_user_unread (user_id, read_at),
                    INDEX idx_reference (reference_type, reference_id),
                    INDEX idx_expires_at (expires_at),
                    INDEX idx_created_at (created_at),
                    INDEX idx_type_created (type, created_at)
                ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
            `,
    },
    {
      name: "Create audit_logs table",
      sql: `
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT,
                    action_type ENUM('create', 'update', 'delete', 'login', 'logout', 'assign') NOT NULL,
                    entity_type VARCHAR(50) NOT NULL,
                    entity_id INT NOT NULL,
                    old_values JSON,
                    new_values JSON,
                    ip_address VARCHAR(45),
                    user_agent VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,

                    INDEX idx_user_id (user_id),
                    INDEX idx_action_type (action_type),
                    INDEX idx_entity_type_id (entity_type, entity_id),
                    INDEX idx_created_at (created_at),
                    INDEX idx_audit_search (entity_type, action_type, created_at)
                ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
            `,
    },
    {
      name: "Create cleanup_events table",
      sql: `
                CREATE TABLE IF NOT EXISTS cleanup_events (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    event_type VARCHAR(50) NOT NULL,
                    last_run TIMESTAMP NULL,
                    next_run TIMESTAMP NULL,
                    status VARCHAR(20) DEFAULT 'pending',
                    affected_rows INT DEFAULT 0,
                    error_message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                    INDEX idx_next_run (next_run),
                    INDEX idx_event_type (event_type),
                    INDEX idx_status (status)
                ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
            `,
    },
  ];

  for (const migration of migrations) {
    try {
      logInfo(`Running: ${migration.name}`);
      await connection.execute(migration.sql);
      logSuccess(`Completed: ${migration.name}`);
    } catch (error) {
      logError(`Failed: ${migration.name} - ${error.message}`);
      throw error;
    }
  }

  logSuccess("All migrations completed successfully!\n");
}

async function seedData(connection) {
  logInfo("Seeding initial data...\n");

  // Check if users already exist
  const [existingUsers] = await connection.execute(
    "SELECT COUNT(*) as count FROM users",
  );
  if (existingUsers[0].count > 0) {
    logWarning("Users already exist, skipping user seeding");
  } else {
    logInfo("Creating initial users...");

    // Hash passwords
    const adminPassword = await bcrypt.hash("admin123", 10);
    const directorPassword = await bcrypt.hash("director123", 10);
    const frontofficePassword = await bcrypt.hash("frontoffice123", 10);
    const cadetPassword = await bcrypt.hash("cadet123", 10);

    const users = [
      // Admins
      ["admin", adminPassword, "admin@distressms.com", "admin"],
      ["john_admin", adminPassword, "john.admin@distressms.com", "admin"],
      ["sarah_admin", adminPassword, "sarah.admin@distressms.com", "admin"],

      // Directors
      ["director", directorPassword, "director@distressms.com", "director"],
      [
        "michael_dir",
        directorPassword,
        "michael.director@distressms.com",
        "director",
      ],
      [
        "lisa_dir",
        directorPassword,
        "lisa.director@distressms.com",
        "director",
      ],
      [
        "james_dir",
        directorPassword,
        "james.director@distressms.com",
        "director",
      ],
      [
        "emma_dir",
        directorPassword,
        "emma.director@distressms.com",
        "director",
      ],

      // Front Office Staff
      [
        "frontoffice",
        frontofficePassword,
        "frontoffice@distressms.com",
        "front_office",
      ],
      [
        "alex_front",
        frontofficePassword,
        "alex.front@distressms.com",
        "front_office",
      ],
      [
        "maria_front",
        frontofficePassword,
        "maria.front@distressms.com",
        "front_office",
      ],
      [
        "david_front",
        frontofficePassword,
        "david.front@distressms.com",
        "front_office",
      ],
      [
        "sophie_front",
        frontofficePassword,
        "sophie.front@distressms.com",
        "front_office",
      ],
      [
        "ryan_front",
        frontofficePassword,
        "ryan.front@distressms.com",
        "front_office",
      ],
      [
        "anna_front",
        frontofficePassword,
        "anna.front@distressms.com",
        "front_office",
      ],
      [
        "tom_front",
        frontofficePassword,
        "tom.front@distressms.com",
        "front_office",
      ],

      // Cadets
      ["cadet", cadetPassword, "cadet@distressms.com", "cadet"],
      ["peter_cadet", cadetPassword, "peter.cadet@distressms.com", "cadet"],
      ["julia_cadet", cadetPassword, "julia.cadet@distressms.com", "cadet"],
      ["mark_cadet", cadetPassword, "mark.cadet@distressms.com", "cadet"],
      ["lucy_cadet", cadetPassword, "lucy.cadet@distressms.com", "cadet"],
      ["chris_cadet", cadetPassword, "chris.cadet@distressms.com", "cadet"],
      ["nina_cadet", cadetPassword, "nina.cadet@distressms.com", "cadet"],
      ["kevin_cadet", cadetPassword, "kevin.cadet@distressms.com", "cadet"],
      ["grace_cadet", cadetPassword, "grace.cadet@distressms.com", "cadet"],
      ["daniel_cadet", cadetPassword, "daniel.cadet@distressms.com", "cadet"],
      ["amy_cadet", cadetPassword, "amy.cadet@distressms.com", "cadet"],
      ["robert_cadet", cadetPassword, "robert.cadet@distressms.com", "cadet"],
      ["claire_cadet", cadetPassword, "claire.cadet@distressms.com", "cadet"],
      ["lucas_cadet", cadetPassword, "lucas.cadet@distressms.com", "cadet"],
      ["olivia_cadet", cadetPassword, "olivia.cadet@distressms.com", "cadet"],
    ];

    for (const [username, password, email, role] of users) {
      try {
        await connection.execute(
          "INSERT INTO users (username, password, email, role, is_active) VALUES (?, ?, ?, ?, 1)",
          [username, password, email, role],
        );
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY") {
          throw error;
        }
      }
    }

    logSuccess(`Created ${users.length} initial users`);
  }

  // Check if sample distress messages exist
  const [existingMessages] = await connection.execute(
    "SELECT COUNT(*) as count FROM distress_messages",
  );
  if (existingMessages[0].count > 0) {
    logWarning("Distress messages already exist, skipping message seeding");
  } else {
    logInfo("Creating sample distress messages...");

    const messages = [
      [
        "DM2024001",
        "Captain Johnson",
        "REF001",
        "Medical Emergency at Sea",
        "United States",
        "John Smith",
        "Medical Emergency",
        "Passenger suffering heart attack on cruise ship",
        "urgent",
        "resolved",
        1,
        5,
      ],
      [
        "DM2024002",
        "Harbor Master",
        "REF002",
        "Vessel in Distress",
        "Canada",
        "Mary Williams",
        "Ship Emergency",
        "Cargo vessel taking on water near coast",
        "high",
        "resolved",
        2,
        6,
      ],
      [
        "DM2024003",
        "Coast Guard Station",
        "REF003",
        "Missing Person Report",
        "United Kingdom",
        "David Brown",
        "Missing Person",
        "Tourist missing from hiking trail",
        "medium",
        "in_progress",
        3,
        7,
      ],
      [
        "DM2024004",
        "Emergency Services",
        "REF004",
        "Aircraft Emergency",
        "Australia",
        "Sarah Davis",
        "Aviation Emergency",
        "Small aircraft forced landing",
        "high",
        "assigned",
        1,
        8,
      ],
      [
        "DM2024005",
        "Police Department",
        "REF005",
        "Natural Disaster Response",
        "Japan",
        "Multiple Victims",
        "Natural Disaster",
        "Earthquake response coordination needed",
        "urgent",
        "in_progress",
        2,
        9,
      ],
      [
        "DM2024006",
        "Fire Department",
        "REF006",
        "Building Collapse",
        "Italy",
        "Construction Workers",
        "Structural Emergency",
        "Building collapse with trapped workers",
        "urgent",
        "pending",
        3,
        null,
      ],
      [
        "DM2024007",
        "Red Cross",
        "REF007",
        "Humanitarian Crisis",
        "Somalia",
        "Refugee Families",
        "Humanitarian",
        "Urgent medical supplies needed",
        "high",
        "assigned",
        1,
        18,
      ], // peter_cadet
      [
        "DM2024008",
        "Airport Authority",
        "REF008",
        "Security Incident",
        "France",
        "Airport Staff",
        "Security",
        "Suspicious package at terminal",
        "medium",
        "resolved",
        2,
        19,
      ], // julia_cadet
      [
        "DM2024009",
        "Maritime Authority",
        "REF009",
        "Oil Spill Response",
        "Norway",
        "Environmental Team",
        "Environmental",
        "Oil spill cleanup coordination",
        "high",
        "in_progress",
        3,
        12,
      ],
      [
        "DM2024010",
        "Hospital",
        "REF010",
        "Mass Casualty Event",
        "Spain",
        "Multiple Patients",
        "Medical Emergency",
        "Bus accident with multiple injuries",
        "urgent",
        "pending",
        1,
        null,
      ],
    ];

    for (const message of messages) {
      await connection.execute(
        `
                INSERT INTO distress_messages
                (folio_number, sender_name, reference_number, subject, country_of_origin, distressed_person_name, nature_of_case, case_details, priority, status, created_by, assigned_to, created_at, first_response_at, resolved_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY),
                    CASE WHEN ? != 'pending' THEN DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 29) DAY) ELSE NULL END,
                    CASE WHEN ? = 'resolved' THEN DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 15) DAY) ELSE NULL END)
            `,
        [...message, message[9], message[9]],
      );
    }

    logSuccess(`Created ${messages.length} sample distress messages`);
  }

  logSuccess("Data seeding completed!\n");
}

async function createIndexes(connection) {
  logInfo("Creating additional performance indexes...");

  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active)",
    "CREATE INDEX IF NOT EXISTS idx_messages_status_priority ON distress_messages(status, priority, created_at)",
    "CREATE INDEX IF NOT EXISTS idx_assignments_assignee_status ON case_assignments(assigned_to, status)",
    "CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read_at, created_at)",
  ];

  for (const indexSql of indexes) {
    try {
      await connection.execute(indexSql);
    } catch (error) {
      // Ignore if index already exists
      if (!error.message.includes("Duplicate key name")) {
        logWarning(`Index creation warning: ${error.message}`);
      }
    }
  }

  logSuccess("Performance indexes created");
}

async function displayStatistics(connection) {
  logInfo("Database Statistics:\n");

  try {
    const [userStats] = await connection.execute(`
            SELECT
                role,
                COUNT(*) as total_users,
                SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users
            FROM users
            GROUP BY role
            ORDER BY FIELD(role, 'admin', 'director', 'front_office', 'cadet')
        `);

    console.log(colors.cyan + "👥 User Statistics:" + colors.reset);
    userStats.forEach((stat) => {
      console.log(
        `   ${stat.role.padEnd(15)}: ${stat.active_users}/${stat.total_users} active`,
      );
    });

    const [messageStats] = await connection.execute(`
            SELECT
                status,
                COUNT(*) as count
            FROM distress_messages
            GROUP BY status
            ORDER BY FIELD(status, 'pending', 'assigned', 'in_progress', 'resolved')
        `);

    console.log(colors.cyan + "\n📊 Case Statistics:" + colors.reset);
    messageStats.forEach((stat) => {
      console.log(`   ${stat.status.padEnd(15)}: ${stat.count} cases`);
    });

    logSuccess("\n🎉 Database setup completed successfully!");
    logInfo("🔑 Default Login Credentials:");
    console.log("   Admin:       admin / admin123");
    console.log("   Director:    director / director123");
    console.log("   Front Office: frontoffice / frontoffice123");
    console.log("   Cadet:       cadet / cadet123");
  } catch (error) {
    logWarning("Could not fetch statistics, but setup completed successfully");
  }
}

async function setupDatabase() {
  let connection = null;

  try {
    // Step 1: Connect to MySQL without database
    logInfo(
      `Connecting to MySQL at ${dbConfig.host}:${dbConfig.port} as ${dbConfig.user}`,
    );
    connection = await createConnection(false);

    // Step 2: Create database
    await createDatabase(connection);
    await connection.end();

    // Step 3: Connect to the specific database
    logInfo(`Connecting to database '${databaseName}'...`);
    connection = await createConnection(true);

    // Step 4: Run migrations
    await runMigrations(connection);

    // Step 5: Create additional indexes
    await createIndexes(connection);

    // Step 6: Seed initial data
    await seedData(connection);

    // Step 7: Display statistics
    await displayStatistics(connection);
  } catch (error) {
    logError(`Database setup failed: ${error.message}`);

    if (error.code === "ECONNREFUSED") {
      logError("Connection refused. Please ensure:");
      logError("1. MySQL server is running");
      logError("2. MySQL is listening on the correct port");
      logError("3. Check your MySQL service status");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      logError("Access denied. Please check:");
      logError("1. Username and password are correct");
      logError("2. User has proper privileges");
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export { setupDatabase };
