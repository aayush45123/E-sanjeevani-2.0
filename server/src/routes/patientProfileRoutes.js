import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createProfile,
  getProfile,
  updateProfile,
  getProfileStatus,
} from "../controllers/patientProfileController.js";

const router = express.Router();

// All routes below require a valid JWT — no exceptions
router.use(authMiddleware);

// Lightweight status check — called by dashboard on every load
// Returns only { isProfileComplete: true/false }
router.get("/status", getProfileStatus);

// Full profile fetch — called by profile page & settings
router.get("/", getProfile);

// One-time profile creation — called on first-time form submit
router.post("/", createProfile);

// Partial update — called if user edits their profile later
router.patch("/", updateProfile);

export default router;
