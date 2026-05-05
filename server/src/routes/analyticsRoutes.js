import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getDoctorAnalytics } from "../controllers/analytics.controller.js";

const router = express.Router();

// Doctor Analytics (Protected, Doctor only)
router.get("/doctor", authMiddleware, getDoctorAnalytics);

export default router;
