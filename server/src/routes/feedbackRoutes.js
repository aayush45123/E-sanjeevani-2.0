import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { submitFeedback, getDoctorRating, checkFeedback } from "../controllers/feedbackController.js";

const router = express.Router();

router.use(authMiddleware);

// Patient submits feedback after a completed consultation
router.post("/submit", submitFeedback);

// Check if patient already submitted feedback for a consultation
router.get("/check/:consultationId", checkFeedback);

// Get aggregated rating for a doctor (used by available doctors listing)
router.get("/doctor/:doctorId", getDoctorRating);

export default router;
