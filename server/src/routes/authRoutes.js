import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  register,
  login,
  logout,
  me,
  refresh,
  getPatientProfile,
  updatePatientProfile,
  completePatientProfile,
} from "../controllers/authController.js";

import { validate } from "../validators/validation.middleware.js";
import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validator.js";

const router = express.Router();

// Public routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// Protected routes
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/me", authMiddleware, me);

// Patient profile routes (MongoDB compatibility stubs)
router.get("/patient/me", authMiddleware, getPatientProfile);
router.put("/patient/update", authMiddleware, updatePatientProfile);
router.put("/patient/complete-profile", authMiddleware, completePatientProfile);

export default router;
