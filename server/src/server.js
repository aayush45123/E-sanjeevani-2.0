import "dotenv/config";

import app from "./app.js";
import http from "http";

import { checkPostgresConnection } from "./config/neonDb.js";

import initializeSocket from "./services/socketServer.js";
import { initializeConsultationReminders } from "./utils/consultationReminderJob.js";

const PORT = process.env.PORT || 5000;

export let io = null;

const startServer = async () => {
  try {

    // New PostgreSQL connection
    await checkPostgresConnection();

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
