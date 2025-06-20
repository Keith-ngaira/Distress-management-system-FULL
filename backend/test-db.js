import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function testConnection() {
  console.log("🔍 Testing MySQL connection...");
  console.log("📋 Connection details from .env:");
  console.log("   Host:", process.env.DB_HOST);
  console.log("   User:", process.env.DB_USER);
  console.log("   Port:", process.env.DB_PORT);
  console.log("   Database:", process.env.DB_NAME);

  const testConfigs = [
    { host: "127.0.0.1", port: 3306, name: "127.0.0.1:3306" },
    { host: "localhost", port: 3306, name: "localhost:3306" },
    { host: "127.0.0.1", port: 3307, name: "127.0.0.1:3307" },
    { host: "localhost", port: 3307, name: "localhost:3307" },
  ];

  for (const config of testConfigs) {
    try {
      console.log(`\n🔌 Testing connection to ${config.name}...`);
      const basicConnection = await mysql.createConnection({
        host: config.host,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: config.port,
        connectTimeout: 5000,
      });

      console.log(`✅ Connection to ${config.name} successful!`);

      // Check available databases
      const [databases] = await basicConnection.execute("SHOW DATABASES");
      console.log("📁 Available databases:");
      databases.forEach((db) => console.log("   -", db.Database));

      // Check if management database exists
      const managementExists = databases.some(
        (db) => db.Database === "management",
      );
      console.log("🎯 Management database exists:", managementExists);

      await basicConnection.end();

      // If we found a working connection, update the .env file
      if (
        config.host !== process.env.DB_HOST ||
        config.port != process.env.DB_PORT
      ) {
        console.log(
          `\n🔧 This connection works! Consider updating .env to use ${config.name}`,
        );
      }

      console.log("\n🎉 Connection test passed for", config.name);
      return; // Exit after first successful connection
    } catch (error) {
      console.log(`❌ Connection to ${config.name} failed:`, error.code);
    }
  }

  console.log("\n💔 All connection attempts failed");
  console.log("🔍 Possible issues:");
  console.log("   1. MySQL server is not running");
  console.log("   2. MySQL is running on a different port");
  console.log("   3. Firewall is blocking connections");
  console.log("   4. MySQL is configured to reject connections from localhost");
  console.log("   5. Wrong username or password");
}

testConnection();
