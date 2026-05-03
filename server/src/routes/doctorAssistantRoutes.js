import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getDoctorAssistantData } from "../controllers/doctorAssistantController.js";

const router = express.Router();

router.get("/:consultationId", authMiddleware, getDoctorAssistantData);

export default router;
