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
import { liffAuthRoutes } from "./routes/(line)/liffAuth";
import { villagesRoutes } from "./routes/villages";
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

const app = new Elysia()
  .use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? ["https://yourdomain.com"] // เปลี่ยนเป็น domain จริงของคุณ
          : process.env.ALLOWED_ORIGINS?.split(",") || [
              "http://localhost",
              "http://localhost:80",
              "http://127.0.0.1",
              "http://127.0.0.1:80",
              "http://localhost:3000", // fallback for direct frontend access
              "https://9cad948af0e2.ngrok-free.app", // current ngrok URL
            ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Cookie",
        "X-Requested-With",
        "X-Forwarded-For",
        "X-Real-IP",
      ],
    })
  )
  .use(
    cookie({
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    })
  )
  .use(jwt({ name: "jwt", secret: "super-secret", exp: "7d" }))
  /**
   * SECURITY ENHANCEMENT: Comprehensive Security Headers Middleware
   *
   * Added security headers to protect against various attacks:
   * - MIME type sniffing attacks
   * - Clickjacking attacks
   * - XSS attacks
   * - Information leakage
   * - Unauthorized API access
   * - Man-in-the-middle attacks (production)
   */
  .onBeforeHandle(({ set }) => {
    // SECURITY: Prevent MIME type sniffing attacks
    set.headers["X-Content-Type-Options"] = "nosniff";

    // SECURITY: Prevent clickjacking attacks
    set.headers["X-Frame-Options"] = "DENY";

    // SECURITY: Enable XSS protection in browsers
    set.headers["X-XSS-Protection"] = "1; mode=block";

    // SECURITY: Control referrer information leakage
    set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

    // SECURITY: Restrict browser API access
    set.headers["Permissions-Policy"] =
      "camera=(), microphone=(), geolocation=(), payment=()";

    // SECURITY: Prevent cross-domain policy files
    set.headers["X-Permitted-Cross-Domain-Policies"] = "none";

    // SECURITY: Force HTTPS in production (HSTS)
    if (process.env.NODE_ENV === "production") {
      set.headers["Strict-Transport-Security"] =
        "max-age=31536000; includeSubDomains; preload";
    }

    // SECURITY: Content Security Policy to prevent XSS and injection attacks
    set.headers["Content-Security-Policy"] =
      process.env.NODE_ENV === "production"
        ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self';"
        : "default-src 'self' 'unsafe-eval' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self';";
  })
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
  .use(liffAuthRoutes)
  .use(villagesRoutes)
  .get("/", () => "Hello Village Security API!");

// Initialize database connection and start server
async function startServer() {
  try {
    // Test database connection before starting server
    await testConnection();

    const port = parseInt(process.env.PORT || "3001");
    app.listen(port, () => {
      console.log(
        `🦊 Village Security API is running at http://localhost:${port}`
      );
      console.log(
        `📊 Health check available at http://localhost:${port}/api/health`
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
