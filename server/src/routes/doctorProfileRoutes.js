import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createOrUpdateDoctorProfile,
  getDoctorProfile,
  checkDoctorProfileStatus,
} from "../controllers/doctorProfileController.js";
import { validate } from "../validators/validation.middleware.js";
import { doctorProfileSchema } from "../validators/doctor.validator.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", validate(doctorProfileSchema), createOrUpdateDoctorProfile);
router.get("/me", getDoctorProfile);
router.get("/status", checkDoctorProfileStatus);

export default router;
