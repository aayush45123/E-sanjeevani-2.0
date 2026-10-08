import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getDoctorAnalytics,
  getDoctorFollowUps,
  updateDoctorFollowUpStatus,
  getDoctorOverview,
} from "../controllers/analytics.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/doctor", getDoctorAnalytics);
router.get("/doctor-analytics", getDoctorAnalytics);
router.get("/doctor/overview", getDoctorOverview);
router.get("/doctor/follow-ups", getDoctorFollowUps);
router.patch("/doctor/follow-ups/:consultationId/status", updateDoctorFollowUpStatus);

export default router;
