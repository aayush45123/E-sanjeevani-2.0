import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createDoctorAvailability,
  getDoctorOwnAvailability,
  getDoctorAvailabilitySlots,
} from "../controllers/doctorAvailabilityController.js";

const router = express.Router();

router.use(authMiddleware);

/*
Doctor creates available slots

POST /api/doctor-availability
*/
router.post("/", createDoctorAvailability);

/*
Doctor sees own availability

GET /api/doctor-availability/my-slots
*/
router.get("/my-slots", getDoctorOwnAvailability);

/*
Patient fetches doctor's available slots for a specific date

GET /api/doctor-availability/slots/:doctorId
?date=2026-05-01
*/
router.get("/slots/:doctorId", getDoctorAvailabilitySlots);

export default router;
