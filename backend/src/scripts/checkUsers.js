import { executeQuery } from "../db.js";
import bcrypt from "bcrypt";

const checkAndUpdateUsers = async () => {
  try {
    console.log("Checking current users in database...");

    const users = await executeQuery("SELECT username, email, role FROM users");
    console.log("Current users:");
    users.forEach((user) => console.log(`- ${user.username} (${user.role})`));

    // Check if we need to add test users
    const adminUser = users.find((u) => u.username === "admin");

    if (!adminUser) {
      console.log("Adding test users...");

      // Create test users with password123
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash("password123", salt);

      const testUsers = [
        ["admin", hashedPassword, "admin@example.com", "admin"],
        ["director", hashedPassword, "director@example.com", "director"],
        [
          "frontoffice",
          hashedPassword,
          "frontoffice@example.com",
          "front_office",
        ],
        ["cadet", hashedPassword, "cadet@example.com", "cadet"],
      ];

      for (const [username, password, email, role] of testUsers) {
        try {
          await executeQuery(
            'INSERT INTO users (username, password, email, role, is_active, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))',
            [username, password, email, role, true],
          );
          console.log(`✅ Added user: ${username}`);
        } catch (error) {
          if (error.message.includes("UNIQUE constraint failed")) {
            console.log(`⚠️ User ${username} already exists`);
          } else {
            console.error(`❌ Error adding ${username}:`, error.message);
          }
        }
      }
    }

    // Test login
    console.log("\nTesting admin login...");
    const admin = await executeQuery("SELECT * FROM users WHERE username = ?", [
      "admin",
    ]);
    if (admin.length > 0) {
      const isValid = await bcrypt.compare("password123", admin[0].password);
      console.log(`Admin password test: ${isValid ? "✅ PASS" : "❌ FAIL"}`);
    }

    console.log("\n✅ Database check completed!");
    console.log("Test credentials:");
    console.log("- admin/password123");
    console.log("- director/password123");
    console.log("- frontoffice/password123");
    console.log("- cadet/password123");
  } catch (error) {
    console.error("Error:", error);
  }
};

checkAndUpdateUsers();
