import "dotenv/config";

import app from "./app.js";
import http from "http";

import { checkPostgresConnection } from "./config/neonDb.js";

import initializeSocket from "./socket/socketServer.js";
import { initializeConsultationReminders } from "./cron/consultationReminderJob.js";

const PORT = process.env.PORT || 5000;

export let io = null;

const startServer = async () => {
  try {

    // Check PostgreSQL connection (non-blocking server start)
    try {
      await checkPostgresConnection();
    } catch (dbErr) {
      console.warn("⚠️ Neon DB connection warning (will retry automatically):", dbErr.message || dbErr);
    }

    const server = http.createServer(app);

    io = initializeSocket(server);

    // Keep enabled because current reminder job still uses MongoDB
    initializeConsultationReminders();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
