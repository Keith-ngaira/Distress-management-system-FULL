import { executeQuery } from "../db.js";
import bcrypt from "bcrypt";

const fixPasswords = async () => {
  try {
    console.log("Fixing user passwords...");

    // Generate hash for password123
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash("password123", salt);

    console.log('Generated password hash for "password123"');

    // Update all existing users
    const users = ["admin", "director", "frontoffice", "cadet"];

    for (const username of users) {
      try {
        await executeQuery("UPDATE users SET password = ? WHERE username = ?", [
          hashedPassword,
          username,
        ]);
        console.log(`✅ Updated password for: ${username}`);
      } catch (error) {
        console.error(`❌ Error updating ${username}:`, error.message);
      }
    }

    // Test the admin login
    console.log("\nTesting updated passwords...");
    const admin = await executeQuery("SELECT * FROM users WHERE username = ?", [
      "admin",
    ]);
    if (admin.length > 0) {
      const isValid = await bcrypt.compare("password123", admin[0].password);
      console.log(`Admin password test: ${isValid ? "✅ PASS" : "❌ FAIL"}`);

      if (isValid) {
        console.log("\n🎉 Password fix successful!");
        console.log("You can now login with:");
        console.log("- admin/password123");
        console.log("- director/password123");
        console.log("- frontoffice/password123");
        console.log("- cadet/password123");
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

fixPasswords();
