import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getPatientConsultations,
  getConsultationDetail,
  getAvailableDoctors,
  getDoctorProfile,
  createConsultation,
  updateConsultation,
  cancelConsultation,
  getConsultationStats,
} from "../controllers/consultationController.js";

const router = express.Router();

// All routes require auth
router.use(authMiddleware);

// ✅ IMPORTANT: Specific/static routes MUST come before param routes like /:consultationId
// If /:consultationId is first, Express treats "doctors" and "stats" as IDs

// Stats & doctor listing — defined BEFORE /:consultationId
router.get("/my-consultations", getPatientConsultations);
router.get("/stats", getConsultationStats);
router.get("/doctors/available", getAvailableDoctors); // ✅ moved above /:consultationId
router.get("/doctors/:doctorId", getDoctorProfile); // ✅ moved above /:consultationId

// Param routes — come AFTER all static routes
router.get("/:consultationId", getConsultationDetail);
router.post("/", createConsultation);
router.put("/:consultationId", updateConsultation);
router.post("/:consultationId/cancel", cancelConsultation);

export default router;
