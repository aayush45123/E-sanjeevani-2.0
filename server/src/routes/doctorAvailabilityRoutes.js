import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createDoctorAvailability,
  getDoctorOwnAvailability,
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

export default router;
