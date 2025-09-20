#!/usr/bin/env bun
import { startNotifyService } from "./notify.service";
import { randomUUID } from "crypto";

console.log("🚀 Starting WebSocket Notification Service with Hot Reload...");

// Start the WebSocket service
const wsSvc = startNotifyService({ 
  port: parseInt(process.env.WS_PORT || "3002"), 
  path: process.env.WS_PATH || "/ws",
  idleTimeout: parseInt(process.env.WS_IDLE_TIMEOUT || "120")
});

// Ping interval for testing (can be disabled in production)
// if (process.env.NODE_ENV !== "production") {
//   console.log("📡 Starting ping interval for testing...");
//   setInterval(() => {
//     wsSvc.publishAdmin({
//       id: randomUUID(),
//       title: "Ping",
//       level: "info",
//       createdAt: Date.now(),
//     });
//   }, 15000);
// }

console.log(`✅ WebSocket service running on port ${wsSvc.port}${wsSvc.path}`);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down WebSocket service...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down WebSocket service...");
  process.exit(0);
});
