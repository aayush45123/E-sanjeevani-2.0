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
import { validate } from "../validators/validation.middleware.js";
import {
  registerSchema,
  loginSchema,
  fixPasswordSchema,
} from "../validators/auth.validator.js";

const router = express.Router();

// Public routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// Protected routes
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, me);

// Patient profile routes (MongoDB compatibility stubs)
router.get("/patient/me", authMiddleware, getPatientProfile);
router.put("/patient/update", authMiddleware, updatePatientProfile);
router.put("/patient/complete-profile", authMiddleware, completePatientProfile);

// Admin tools
router.post("/admin/fix-password", validate(fixPasswordSchema), fixDoctorPassword);

export default router;
