import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createProfile,
  getProfile,
  updateProfile,
  getProfileStatus,
} from "../controllers/patientProfileController.js";
import { validate } from "../validators/validation.middleware.js";
import {
  createPatientProfileSchema,
  updatePatientProfileSchema,
} from "../validators/patient.validator.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", validate(createPatientProfileSchema), createProfile);
router.get("/", getProfile);
router.patch("/", validate(updatePatientProfileSchema), updateProfile);
router.get("/status", getProfileStatus);

export default router;
