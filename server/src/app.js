// FULL UPDATED server/app.js
// Added doctor profile routes

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import consultationRoutes from "./routes/consultationRoutes.js";
import patientProfileRoutes from "./routes/patientProfileRoutes.js";
import doctorAvailabilityRoutes from "./routes/doctorAvailabilityRoutes.js";
import doctorProfileRoutes from "./routes/doctorProfileRoutes.js";

const app = express();

/*
==================================================
MIDDLEWARE
==================================================
*/

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
==================================================
HEALTH CHECK
==================================================
*/

app.get("/health", (req, res) => {
  res.json({
    status: "Server is running successfully ✅",
  });
});

/*
==================================================
API ROUTES
==================================================
*/

app.use("/api/auth", authRoutes);

app.use("/api/consultations", consultationRoutes);

app.use("/api/patient/profile", patientProfileRoutes);

app.use("/api/doctor-availability", doctorAvailabilityRoutes);

/*
NEW: DOCTOR PROFILE ROUTES
*/

app.use("/api/doctor-profile", doctorProfileRoutes);

/*
==================================================
ERROR HANDLER
==================================================
*/

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

/*
==================================================
404 HANDLER
==================================================
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/*
==================================================
START SERVER
==================================================
*/

// Note: Server startup logic moved to server.js
// This file only exports the configured Express app

export default app;
