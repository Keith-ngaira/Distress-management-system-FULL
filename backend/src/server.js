import { app, server } from "./app.js";
import "./scripts/scheduleCleanup.js";

const PORT = process.env.PORT || 5556;

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Allow a graceful shutdown
  server.close(() => {
    console.log("Server closed due to uncaught exception. Exiting process.");
    process.exit(1);
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle SIGTERM
process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Performing graceful shutdown...");
  server.close(() => {
    console.log("Server closed. Exiting process.");
    process.exit(0);
  });
});

// Start the server
const startServer = () => {
  try {
    // Check if port is in use
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Trying again...`);
        setTimeout(() => {
          server.close();
          server.listen(PORT);
        }, 1000);
      } else {
        console.error("Server error:", error);
        process.exit(1);
      }
    });

    console.log("Starting server...");
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log("Environment:", process.env.NODE_ENV || "development");
      console.log(
        "Frontend URL:",
        process.env.FRONTEND_URL || "http://localhost:3000",
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
