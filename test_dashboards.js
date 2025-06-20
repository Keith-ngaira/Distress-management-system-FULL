#!/usr/bin/env node

/**
 * Comprehensive Dashboard Testing Script
 * Tests all dashboards for all user roles to ensure functionality
 */

const axios = require("axios");

const API_BASE_URL = "http://localhost:5556";
const FRONTEND_URL = "http://localhost:3000";

// Test user credentials
const testUsers = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "director", password: "director123", role: "director" },
  { username: "frontoffice", password: "frontoffice123", role: "front_office" },
  { username: "cadet", password: "cadet123", role: "cadet" },
];

let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
};

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testEndpoint(description, testFn) {
  try {
    console.log(`🧪 Testing: ${description}`);
    await testFn();
    console.log(`✅ PASSED: ${description}`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ FAILED: ${description} - ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ test: description, error: error.message });
  }
}

async function testBackendHealth() {
  await testEndpoint("Backend Health Check", async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    if (response.status !== 200) {
      throw new Error(
        `Backend health check failed with status ${response.status}`,
      );
    }
  });
}

async function testAuthentication(user) {
  await testEndpoint(
    `Authentication for ${user.role} (${user.username})`,
    async () => {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username: user.username,
        password: user.password,
      });

      if (!response.data.success || !response.data.data.token) {
        throw new Error("Login failed or no token received");
      }

      user.token = response.data.data.token;
      user.userData = response.data.data.user;

      if (user.userData.role !== user.role) {
        throw new Error(
          `Role mismatch: expected ${user.role}, got ${user.userData.role}`,
        );
      }
    },
  );
}

async function testDashboardData(user) {
  await testEndpoint(`Dashboard Data for ${user.role}`, async () => {
    const response = await axios.get(`${API_BASE_URL}/api/dashboard`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });

    if (!response.data.success || !response.data.data) {
      throw new Error("Dashboard data request failed");
    }

    const data = response.data.data;

    // Check basic stats
    if (typeof data.stats !== "object") {
      throw new Error("Dashboard stats missing");
    }

    if (typeof data.stats.total !== "number") {
      throw new Error("Total stats missing");
    }

    // Role-specific data checks
    switch (user.role) {
      case "admin":
        // Admin should have general dashboard data
        if (!data.recentCases || !Array.isArray(data.recentCases)) {
          throw new Error("Admin dashboard missing recent cases");
        }
        break;

      case "director":
        // Director should have director-specific data
        if (!data.directorStats) {
          throw new Error("Director dashboard missing director stats");
        }
        if (!data.teamWorkload || !Array.isArray(data.teamWorkload)) {
          throw new Error("Director dashboard missing team workload");
        }
        if (!data.caseAssignments || !Array.isArray(data.caseAssignments)) {
          throw new Error("Director dashboard missing case assignments");
        }
        break;

      case "front_office":
        // Front office should have front office-specific data
        if (!data.frontOfficeStats) {
          throw new Error("Front office dashboard missing front office stats");
        }
        if (!data.myCases || !Array.isArray(data.myCases)) {
          throw new Error("Front office dashboard missing my cases");
        }
        if (!data.performanceMetrics) {
          throw new Error("Front office dashboard missing performance metrics");
        }
        break;

      case "cadet":
        // Cadet should have cadet-specific data
        if (!data.cadetStats) {
          throw new Error("Cadet dashboard missing cadet stats");
        }
        if (!data.myCases || !Array.isArray(data.myCases)) {
          throw new Error("Cadet dashboard missing my cases");
        }
        if (!data.trainingModules || !Array.isArray(data.trainingModules)) {
          throw new Error("Cadet dashboard missing training modules");
        }
        if (!data.performanceMetrics) {
          throw new Error("Cadet dashboard missing performance metrics");
        }
        break;
    }
  });
}

async function testUserManagement(adminUser) {
  await testEndpoint("User Management (Admin only)", async () => {
    if (adminUser.role !== "admin") {
      throw new Error("User management test requires admin user");
    }

    const response = await axios.get(`${API_BASE_URL}/api/users`, {
      headers: {
        Authorization: `Bearer ${adminUser.token}`,
      },
    });

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new Error("User management endpoint failed");
    }

    const users = response.data.data;

    // Check that we have users from all roles
    const roles = users.map((u) => u.role);
    const expectedRoles = ["admin", "director", "front_office", "cadet"];

    for (const role of expectedRoles) {
      if (!roles.includes(role)) {
        throw new Error(`Missing users with role: ${role}`);
      }
    }
  });
}

async function testCaseAssignments(directorUser) {
  await testEndpoint("Case Assignments (Director only)", async () => {
    if (directorUser.role !== "director") {
      throw new Error("Case assignments test requires director user");
    }

    const response = await axios.get(`${API_BASE_URL}/api/case-assignments`, {
      headers: {
        Authorization: `Bearer ${directorUser.token}`,
      },
    });

    if (!response.data.success) {
      throw new Error("Case assignments endpoint failed");
    }

    // This endpoint might return empty array if no assignments exist
    // That's okay, we just need to ensure the endpoint works
  });
}

async function testDistressMessages(user) {
  await testEndpoint(`Distress Messages for ${user.role}`, async () => {
    const response = await axios.get(`${API_BASE_URL}/api/distress-messages`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });

    if (!response.data.success) {
      throw new Error("Distress messages endpoint failed");
    }

    // Response might be empty array, that's okay
  });
}

async function testNotifications(user) {
  await testEndpoint(`Notifications for ${user.role}`, async () => {
    const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });

    if (!response.data.success) {
      throw new Error("Notifications endpoint failed");
    }
  });
}

async function testFrontendAccessibility() {
  await testEndpoint("Frontend Accessibility", async () => {
    try {
      const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
      if (response.status !== 200) {
        throw new Error(`Frontend not accessible, status: ${response.status}`);
      }
    } catch (error) {
      if (error.code === "ECONNREFUSED") {
        throw new Error("Frontend server is not running");
      }
      throw error;
    }
  });
}

async function runAllTests() {
  console.log("🚀 Starting Comprehensive Dashboard Testing...\n");

  // Test backend health
  await testBackendHealth();

  // Test frontend accessibility
  await testFrontendAccessibility();

  // Test authentication for all users
  for (const user of testUsers) {
    await testAuthentication(user);
  }

  // Wait a bit between authentication and dashboard tests
  await wait(1000);

  // Test dashboard data for all users
  for (const user of testUsers) {
    await testDashboardData(user);
  }

  // Test role-specific functionality
  const adminUser = testUsers.find((u) => u.role === "admin");
  const directorUser = testUsers.find((u) => u.role === "director");

  if (adminUser && adminUser.token) {
    await testUserManagement(adminUser);
  }

  if (directorUser && directorUser.token) {
    await testCaseAssignments(directorUser);
  }

  // Test common functionality for all authenticated users
  for (const user of testUsers) {
    if (user.token) {
      await testDistressMessages(user);
      await testNotifications(user);
    }
  }

  // Print results
  console.log("\n📊 Test Results Summary:");
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(
    `📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`,
  );

  if (testResults.errors.length > 0) {
    console.log("\n🚫 Failed Tests:");
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }

  if (testResults.failed === 0) {
    console.log(
      "\n🎉 All tests passed! The distress management system is fully functional.",
    );
  } else {
    console.log("\n⚠️  Some tests failed. Please review the errors above.");
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error("❌ Fatal error running tests:", error.message);
    process.exit(1);
  });
}

module.exports = { runAllTests, testResults };
