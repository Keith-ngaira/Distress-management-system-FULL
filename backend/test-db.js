import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function testConnection() {
  console.log("🔍 Testing MySQL connection...");
  console.log("📋 Connection details:");
  console.log("   Host:", process.env.DB_HOST);
  console.log("   User:", process.env.DB_USER);
  console.log("   Port:", process.env.DB_PORT);
  console.log("   Database:", process.env.DB_NAME);

  try {
    // First, try connecting without specifying a database
    console.log("\n🔌 Testing basic connection...");
    const basicConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

    console.log("✅ Basic MySQL connection successful!");

    // Check available databases
    const [databases] = await basicConnection.execute("SHOW DATABASES");
    console.log("\n📁 Available databases:");
    databases.forEach((db) => console.log("   -", db.Database));

    // Check if management database exists
    const managementExists = databases.some(
      (db) => db.Database === "management",
    );
    console.log("\n🎯 Management database exists:", managementExists);

    if (!managementExists) {
      console.log("🔨 Creating management database...");
      await basicConnection.execute("CREATE DATABASE management");
      console.log("✅ Management database created!");
    }

    await basicConnection.end();

    // Now test connection to management database
    console.log("\n🔌 Testing connection to management database...");
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
    });

    console.log("✅ Management database connection successful!");

    // Check tables
    const [tables] = await dbConnection.execute("SHOW TABLES");
    console.log("\n📋 Tables in management database:");
    if (tables.length === 0) {
      console.log("   (No tables found - you may need to run the schema)");
    } else {
      tables.forEach((table) => console.log("   -", Object.values(table)[0]));
    }

    await dbConnection.end();

    console.log("\n🎉 All connection tests passed!");
  } catch (error) {
    console.error("\n❌ Connection failed:");
    console.error("   Error code:", error.code);
    console.error("   Error message:", error.message);
    console.error("   Full error:", error);
  }
}

testConnection();
