import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  register,
  login,
  logout,
  me,
  getPatientProfile,
  updatePatientProfile,
  completePatientProfile,
  fixDoctorPassword,
} from "../controllers/authController.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, me);

// Patient profile routes
router.get("/patient/me", authMiddleware, getPatientProfile);
router.put("/patient/update", authMiddleware, updatePatientProfile);
router.put("/patient/complete-profile", authMiddleware, completePatientProfile);
router.post("/admin/fix-password", fixDoctorPassword);

export default router;
