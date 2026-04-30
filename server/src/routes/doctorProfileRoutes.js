import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";

import {
  createOrUpdateDoctorProfile,
  getDoctorProfile,
  checkDoctorProfileStatus,
} from "../controllers/doctorProfileController.js";

const router = express.Router();

/*
==================================================
ALL ROUTES REQUIRE AUTH
==================================================
*/

router.use(authMiddleware);

/*
==================================================
CREATE / UPDATE DOCTOR PROFILE
POST /api/doctor-profile
==================================================
*/

router.post("/", createOrUpdateDoctorProfile);

/*
==================================================
GET LOGGED-IN DOCTOR PROFILE
GET /api/doctor-profile/me
==================================================
*/

router.get("/me", getDoctorProfile);

/*
==================================================
CHECK PROFILE COMPLETION STATUS
GET /api/doctor-profile/status
==================================================
*/

router.get("/status", checkDoctorProfileStatus);

export default router;
