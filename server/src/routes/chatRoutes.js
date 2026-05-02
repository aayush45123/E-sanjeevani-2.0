import express from "express";
import {
  handleChat,
  saveConsultationMessage,
  getConsultationMessages,
} from "../controllers/chatController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// AI Chat endpoint (no auth required for general chat)
router.post("/", handleChat);

// Consultation messages endpoints (auth required)
router.post(
  "/consultation/:consultationId/save",
  authMiddleware,
  saveConsultationMessage,
);
router.get(
  "/consultation/:consultationId/messages",
  authMiddleware,
  getConsultationMessages,
);

export default router;
