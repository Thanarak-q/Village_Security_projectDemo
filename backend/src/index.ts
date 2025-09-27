import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import jwt from "@elysiajs/jwt";
import cookie from "@elysiajs/cookie";
import "dotenv/config";
import { houseManageRoutes } from "./routes/houseManage";
import { visitorRecordRoutes } from "./routes/visitorRecord";
import { visitorRecordWeeklyRoutes } from "./routes/visitorRecord-weekly";
import { visitorRecordMonthlyRoutes } from "./routes/visitorRecord-monthly";
import { visitorRecordYearlyRoutes } from "./routes/visitorRecord-yearly";
import { testConnection, closeConnection, getPoolStats } from "./db/drizzle";
import { statsCardRoutes } from "./routes/statsCard";
import { userTableRoutes } from "./routes/userTable";
import { pendingUsersRoutes } from "./routes/pendingUsers";
import { authRoutes } from "./routes/auth";
import { adminSettingsRoutes } from "./routes/adminSettings";
import { adminActivityLogsRoutes } from "./routes/adminActivityLogs";
import { liffAuthRoutes } from "./routes/(line)/liffAuth";
import { villagesRoutes } from "./routes/villages";
import { notificationsRoutes } from "./routes/notifications";
import { superAdminVillagesRoutes } from "./routes/superAdminVillages";
import { superAdminAdminsRoutes } from "./routes/superAdminAdmins";
import { superAdminStatsRoutes } from "./routes/superAdminStats";
import { adminManagementRoutes } from "./routes/adminManagement";
import { staffManagementRoutes } from "./routes/staffManagement";
import { redirectRoutes } from "./routes/redirect";
import { villageSelectionRoutes } from "./routes/villageSelection";
import approvalForm from "./routes/submitVisitorForm";
import { imageStorageRoutes } from "./routes/imageStorage";
/**
 * SECURITY ENHANCEMENT: Secure Health Check Endpoint
 *
 * Changes made:
 * - Removed database pool statistics from response (information disclosure)
 * - Removed detailed error messages from response (information leakage)
 * - Keep error logging for internal monitoring only
 *
 * Security benefit: Prevents attackers from gathering internal system information
 */
const healthCheck = new Elysia().get("/api/health", async () => {
  try {
    await testConnection();

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "Village Security API",
      // REMOVED: database pool stats (security - information disclosure)
    };
  } catch (error) {
    // SECURITY: Log error internally but don't expose details to client
    console.error("Health check failed:", error);
    return {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      service: "Village Security API",
      // REMOVED: error details from response (security - information leakage)
    };
  }
});

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is required but not set");
}

const app = new Elysia()
  .use(cors())
  .use(
    cookie({
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    })
  )
  .use(jwt({ name: "jwt", secret: jwtSecret, exp: "7d" }))
  .use(healthCheck)
  .use(houseManageRoutes)
  .use(visitorRecordRoutes)
  .use(visitorRecordWeeklyRoutes)
  .use(visitorRecordMonthlyRoutes)
  .use(visitorRecordYearlyRoutes)
  .use(statsCardRoutes)
  .use(userTableRoutes)
  .use(pendingUsersRoutes)
  .use(authRoutes)
  .use(adminSettingsRoutes)
  .use(adminActivityLogsRoutes)
  .use(liffAuthRoutes)
  .use(villagesRoutes)
  .use(notificationsRoutes)
  .use(approvalForm)
  // .use(residentApi)
  // .use(approvalForm)
  .use(superAdminVillagesRoutes)
  .use(superAdminAdminsRoutes)
  .use(superAdminStatsRoutes)
  .use(adminManagementRoutes)
  .use(staffManagementRoutes)
  .use(redirectRoutes)
  .use(villageSelectionRoutes)
  .use(imageStorageRoutes)
  .get("/", () => "Hello Village Security API!");

// Initialize database connection and start server
async function startServer() {
  try {
    // Test database connection before starting server
    await testConnection();

    // Optionally ensure MinIO bucket exists at startup for faster first-upload
    if (process.env.MINIO_ENDPOINT && process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY) {
      const { Client: MinioClient } = await import('minio');
      const minio = new MinioClient({
        endPoint: process.env.MINIO_ENDPOINT as string,
        port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : 9000,
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY as string,
        secretKey: process.env.MINIO_SECRET_KEY as string,
      });
      const bucket = process.env.MINIO_BUCKET || 'images';
      const exists = await minio.bucketExists(bucket).catch(() => false);
      if (!exists) {
        await minio.makeBucket(bucket, 'us-east-1');
        console.log(`🪣 MinIO bucket created: ${bucket}`);
      } else {
        console.log(`🪣 MinIO bucket exists: ${bucket}`);
      }
    }

    const port = parseInt(process.env.PORT || "3001");
    
    // Start the Elysia app and get the server
    const server = app.listen({
      port,
      hostname: '0.0.0.0'
    }, () => {
      console.log(
        `🦊 Village Security API is running on port ${port}`
      );
      console.log(
        `📊 Health check available at /api/health`
      );
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
    
    
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await closeConnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await closeConnection();
  process.exit(0);
});

// Start the server
startServer();
