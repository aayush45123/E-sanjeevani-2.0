import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getDoctorAssistantData } from "../controllers/doctorAssistantController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/data/:consultationId", getDoctorAssistantData);

export default router;
