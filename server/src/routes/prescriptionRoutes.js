import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createPrescription,
  getPrescriptionById,
  getPatientPrescriptions,
  getDoctorPatientPrescriptions,
  finalizePrescription,
  amendPrescription,
  discontinueMedication,
} from "../controllers/prescriptionController.js";

const router = express.Router();
router.use(authMiddleware);

// ── CRUD ─────────────────────────────────────────────────────────────────────
/** POST /api/prescriptions  — Doctor issues a prescription (draft → finalized) */
router.post("/", createPrescription);

/** GET /api/prescriptions/:id */
router.get("/:id", getPrescriptionById);

/** GET /api/prescriptions/patient/:patientId */
router.get("/patient/:patientId", getPatientPrescriptions);

/** GET /api/prescriptions/doctor-patient/:patientId */
router.get("/doctor-patient/:patientId", getDoctorPatientPrescriptions);

// ── LIFECYCLE ─────────────────────────────────────────────────────────────────
/** PATCH /api/prescriptions/:id/finalize — Make prescription immutable */
router.patch("/:id/finalize", finalizePrescription);

/** POST /api/prescriptions/:id/amend — Create a correction of a finalized prescription */
router.post("/:id/amend", amendPrescription);

/** PATCH /api/prescriptions/:id/items/:itemId/discontinue — Doctor discontinues a medicine */
router.patch("/:id/items/:itemId/discontinue", discontinueMedication);

export default router;
