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
} from "../controllers/consultationController.js";

const router = express.Router();

/*
==================================================
ALL ROUTES REQUIRE AUTH
==================================================
*/

router.use(authMiddleware);

/*
==================================================
PATIENT ROUTES
==================================================
*/
router.get("/doctors/available", getAvailableDoctors); // ✅ moved above /:consultationId

/*
Book consultation
POST /api/consultations/book
*/
router.post("/book", createConsultation);

/*
Get patient's own consultations
GET /api/consultations/my-consultations
*/
router.get("/my-consultations", getPatientConsultations);

/*
==================================================
DOCTOR SLOT ROUTES
==================================================
*/

/*
Get available slots for selected doctor + date

GET /api/consultations/doctor-slots
?doctorId=xxx
&date=2026-04-30
*/
router.get("/doctor-slots", getDoctorAvailableSlots);

/*
==================================================
DOCTOR DASHBOARD ROUTES
==================================================
*/

/*
Doctor dashboard consultation list

GET /api/consultations/doctor-dashboard
*/
router.get("/doctor-dashboard", getDoctorConsultations);

/*
Update consultation status

PATCH /api/consultations/:consultationId/status
*/
router.patch("/:consultationId/status", updateConsultationStatus);

/*
Add doctor notes + prescription

PATCH /api/consultations/:consultationId/notes
*/
router.patch("/:consultationId/notes", addDoctorNotes);

export default router;
