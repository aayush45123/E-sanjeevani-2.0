import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";

import {
  createDoctorAvailability,
  getDoctorOwnAvailability,
  getDoctorAvailabilitySlots,
  deleteDoctorAvailability,
} from "../controllers/doctorAvailabilityController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createDoctorAvailability);

router.get("/my-slots", getDoctorOwnAvailability);

router.get("/slots/:doctorId", getDoctorAvailabilitySlots);

router.delete("/:availabilityId", deleteDoctorAvailability);

export default router;
