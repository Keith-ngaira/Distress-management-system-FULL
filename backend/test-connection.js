import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function testMultipleHosts() {
  console.log("🔍 Testing multiple host configurations...");

  const hosts = [
    "localhost",
    "127.0.0.1",
    "host.docker.internal",
    "mysql",
    "db",
    "database",
    "172.17.0.1", // Common Docker bridge IP
    "192.168.1.1", // Common network gateway
  ];

  const ports = [3306, 3307, 33060];

  for (const host of hosts) {
    for (const port of ports) {
      try {
        console.log(`\n🔌 Testing ${host}:${port}...`);

        const connection = await mysql.createConnection({
          host: host,
          user: process.env.DB_USER || "root",
          password: process.env.DB_PASSWORD || "",
          port: port,
          connectTimeout: 3000,
          acquireTimeout: 3000,
          timeout: 3000,
        });

        console.log(`✅ Connection to ${host}:${port} SUCCESSFUL!`);

        // Test basic query
        const [result] = await connection.execute(
          "SELECT 1 as test, VERSION() as version",
        );
        console.log(`   MySQL Version: ${result[0].version}`);

        // Show databases
        const [databases] = await connection.execute("SHOW DATABASES");
        console.log(
          `   Available databases: ${databases.map((db) => Object.values(db)[0]).join(", ")}`,
        );

        await connection.end();

        // Update .env file with working configuration
        console.log(`\n🔧 Updating .env file to use ${host}:${port}`);
        const fs = await import("fs");
        let envContent = fs.readFileSync(".env", "utf8");
        envContent = envContent.replace(/DB_HOST=.*/, `DB_HOST=${host}`);
        envContent = envContent.replace(/DB_PORT=.*/, `DB_PORT=${port}`);
        fs.writeFileSync(".env", envContent);

        console.log("✅ .env file updated successfully!");
        return { host, port };
      } catch (error) {
        console.log(
          `❌ ${host}:${port} failed: ${error.code || error.message}`,
        );
      }
    }
  }

  console.log("\n💔 No working database connection found!");
  console.log("\n🔍 Please check:");
  console.log("1. MySQL is running and accessible");
  console.log("2. Check your database credentials");
  console.log("3. Verify network connectivity");
  console.log("4. Check if running in Docker/container environment");

  return null;
}

// Run the test
testMultipleHosts()
  .then((result) => {
    if (result) {
      console.log(
        `\n🎉 Database connection configured successfully: ${result.host}:${result.port}`,
      );
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
