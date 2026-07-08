import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  handleChat,
  saveConsultationMessage,
  getConsultationMessages,
} from "../controllers/chatController.js";
import { validate } from "../validators/validation.middleware.js";
import {
  saveMessageSchema,
  getMessagesSchema,
} from "../validators/chat.validator.js";

const router = express.Router();

router.use(authMiddleware);

// General AI medical chatbot
router.post("/", handleChat);

// Consultation rooms chat
router.post("/consultation/:consultationId/save", validate(saveMessageSchema), saveConsultationMessage);
router.get("/consultation/:consultationId/messages", validate(getMessagesSchema), getConsultationMessages);

export default router;
