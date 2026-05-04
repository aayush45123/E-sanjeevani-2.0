import app from "./app.js";
import http from "http";
import connectDB from "./config/db.js";
import initializeSocket from "./services/socketServer.js";
import { initializeConsultationReminders } from "./utils/consultationReminderJob.js";

const PORT = process.env.PORT || 5000;

// Global io instance
export let io = null;

// Connect to database and start server
connectDB()
  .then(() => {
    // Create HTTP server with Express app
    const server = http.createServer(app);

    // Initialize Socket.io and store the instance
    io = initializeSocket(server);

    // Initialize consultation reminder job
    initializeConsultationReminders();

    // Start listening
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to database:", err);
    process.exit(1);
  });
