import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { villageRoutes } from "./routes/village";
import { houseRoutes } from "./routes/house";
import { residentRoutes } from "./routes/resident";
import { guardRoutes } from "./routes/guard";
import { adminRoutes } from "./routes/admin";
import { houseMemberRoutes } from "./routes/houseMember";
import { visitorRecordRoutes } from "./routes/visitorRecord";
import { visitorRecordWeeklyRoutes } from "./routes/visitorRecord-weekly";
import { visitorRecordMonthlyRoutes } from "./routes/visitorRecord-monthly";
import { visitorRecordYearlyRoutes } from "./routes/visitorRecord-yearly";
import { testConnection, closeConnection, getPoolStats } from "./db/drizzle";
import { statsCardRoutes } from "./routes/statsCard";
import { userTableRoutes } from "./routes/userTable";
// Health check endpoint
const healthCheck = new Elysia()
  .get("/api/health", async () => {
    try {
      await testConnection();
      const poolStats = getPoolStats();
      
      return { 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        service: "Village Security API",
        database: {
          status: "connected",
          pool: poolStats
        }
      };
    } catch (error) {
      return { 
        status: "unhealthy", 
        timestamp: new Date().toISOString(),
        service: "Village Security API",
        database: {
          status: "disconnected",
          error: error instanceof Error ? error.message : "Unknown error"
        }
      };
    }
  });

const app = new Elysia()
  .use(cors())
  .use(healthCheck)
  .use(villageRoutes)
  .use(houseRoutes)
  .use(residentRoutes)
  .use(guardRoutes)
  .use(adminRoutes)
  .use(houseMemberRoutes)
  .use(visitorRecordRoutes)
  .use(visitorRecordWeeklyRoutes)
  .use(visitorRecordMonthlyRoutes)
  .use(visitorRecordYearlyRoutes)
  .use(statsCardRoutes)
  .use(userTableRoutes)
  .get("/", () => "Hello Village Security API!");

// Initialize database connection and start server
async function startServer() {
  try {
    // Test database connection before starting server
    await testConnection();
    
    app.listen(3001, () => {
      console.log("🦊 Village Security API is running at http://localhost:3001");
      console.log("📊 Health check available at http://localhost:3001/health");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeConnection();
  process.exit(0);
});

// Start the server
startServer();

