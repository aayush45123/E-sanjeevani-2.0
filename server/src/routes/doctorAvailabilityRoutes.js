import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createDoctorAvailability,
  getDoctorOwnAvailability,
  getDoctorAvailabilitySlots,
  deleteDoctorAvailability,
} from "../controllers/doctorAvailabilityController.js";
import { validate } from "../validators/validation.middleware.js";
import {
  createAvailabilitySchema,
  getAvailabilitySlotsSchema,
  deleteAvailabilitySchema,
} from "../validators/availability.validator.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", validate(createAvailabilitySchema), createDoctorAvailability);
router.get("/my-slots", getDoctorOwnAvailability);
router.get("/slots/:doctorId", validate(getAvailabilitySlotsSchema), getDoctorAvailabilitySlots);
router.delete("/:availabilityId", validate(deleteAvailabilitySchema), deleteDoctorAvailability);

export default router;
