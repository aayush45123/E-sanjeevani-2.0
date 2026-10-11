import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getDoctorAssistantData,
  chatWithDoctorAssistant,
} from "../controllers/doctorAssistantController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/data/:consultationId", getDoctorAssistantData);
router.post("/chat", chatWithDoctorAssistant);

export default router;
