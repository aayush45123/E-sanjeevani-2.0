import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createConsultation,
  getDoctorAvailableSlots,
  getDoctorConsultations,
  getPatientConsultations,
  updateConsultationStatus,
  addDoctorNotes,
  getAvailableDoctors,
  getDoctorsNearMe,
  markUserJoined,
} from "../controllers/consultationController.js";
import { validate } from "../validators/validation.middleware.js";
import {
  getAvailableDoctorsSchema,
  getDoctorAvailableSlotsSchema,
  createConsultationSchema,
  updateConsultationStatusSchema,
  addDoctorNotesSchema,
  getDoctorsNearMeSchema,
  markUserJoinedSchema,
} from "../validators/consultation.validator.js";

const router = express.Router();

router.use(authMiddleware);

// Patient routes
router.get("/doctors/available", validate(getAvailableDoctorsSchema), getAvailableDoctors);
router.get("/doctors/nearby", validate(getDoctorsNearMeSchema), getDoctorsNearMe);
router.post("/book", validate(createConsultationSchema), createConsultation);
router.get("/my-consultations", getPatientConsultations);

// Doctor slots
router.get("/doctor-slots", validate(getDoctorAvailableSlotsSchema), getDoctorAvailableSlots);

// Doctor dashboard
router.get("/doctor-dashboard", getDoctorConsultations);

// Status and notes update
router.patch("/:consultationId/status", validate(updateConsultationStatusSchema), updateConsultationStatus);
router.patch("/:consultationId/notes", validate(addDoctorNotesSchema), addDoctorNotes);
router.post("/:consultationId/mark-joined", validate(markUserJoinedSchema), markUserJoined);

export default router;
