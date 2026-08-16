// FULL UPDATED server/app.js
// Added doctor profile routes

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import consultationRoutes from "./routes/consultationRoutes.js";
import patientProfileRoutes from "./routes/patientProfileRoutes.js";
import doctorAvailabilityRoutes from "./routes/doctorAvailabilityRoutes.js";
import doctorProfileRoutes from "./routes/doctorProfileRoutes.js";
import medicalRecordRoutes from "./routes/medicalRecordRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import triageRoutes from "./routes/triageRoutes.js";
import aiTriageRoutes from "./routes/aiTriageRoutes.js";
import doctorAssistantRoutes from "./routes/doctorAssistantRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import feverRoutes from "./routes/feverRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import patientHistoryRoutes from "./routes/patientHistoryRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/*
==================================================
MIDDLEWARE
==================================================
*/

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",
  "https://e-sanjeevani-2-0.vercel.app",
];

if (process.env.CLIENT_URL) {
  const customClientUrl = process.env.CLIENT_URL.replace(/\/$/, "");
  if (!allowedOrigins.includes(customClientUrl)) {
    allowedOrigins.push(customClientUrl);
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.startsWith("http://192.168.") ||
        origin.startsWith("http://10.") ||
        origin.startsWith("http://172.")
      ) {
        return callback(null, true);
      }

      console.warn(`[CORS Blocked] Origin: ${origin}`);
      return callback(new Error("CORS Policy Violation: Origin not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"],
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/*
==================================================
REQUEST LOGGING MIDDLEWARE
==================================================
*/
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

/*
==================================================
HEALTH CHECK
Keep these lightweight — no DB, no ML, no external calls.
UptimeRobot pings /api/health every 5 min to keep the
Render free-tier service awake.
==================================================
*/

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "E-Sanjeevani API",
    timestamp: new Date().toISOString(),
  });
});

// /api/health — matches Render Health Check path and UptimeRobot monitor
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "E-Sanjeevani API",
    timestamp: new Date().toISOString(),
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

app.use("/api/triage", triageRoutes);

app.use("/api/ai-triage", aiTriageRoutes);

app.use("/api/doctor-assistant", doctorAssistantRoutes);
app.use("/api/analytics", analyticsRoutes);

/*
FEVER DIFFERENTIAL ASSESSMENT ROUTES
*/
app.use("/api/fever", feverRoutes);

/*
NEW: DOCTOR PROFILE ROUTES
*/

app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/doctor-profile", doctorProfileRoutes);

/*
PRESCRIPTION ROUTES — POST /api/prescriptions, GET /api/prescriptions/:id etc.
*/
app.use("/api/prescriptions", prescriptionRoutes);

/*
PATIENT HISTORY & CLINICAL RECORDS ROUTES
*/
app.use("/api/patient-history", patientHistoryRoutes);

/*aichat*/
app.use("/api/chat", chatRoutes);

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
