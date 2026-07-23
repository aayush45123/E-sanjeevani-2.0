import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getDoctorAnalytics } from "../controllers/analytics.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/doctor", getDoctorAnalytics);
router.get("/doctor-analytics", getDoctorAnalytics);

export default router;
