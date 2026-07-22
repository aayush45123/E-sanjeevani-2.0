import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createTriageSession,
  processTriageResponse,
  getTriageHistory,
  getTriageSessionDetails,
  sendChatMessage,
  deleteTriageSession,
} from "../controllers/triageController.js";
import { validate } from "../validators/validation.middleware.js";
import {
  createTriageSessionSchema,
  processTriageSchema,
  triageDetailsSchema,
  sendChatMessageSchema,
  deleteSessionSchema,
} from "../validators/triage.validator.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/create", validate(createTriageSessionSchema), createTriageSession);
router.post("/process/:triageSessionId", validate(processTriageSchema), processTriageResponse);
router.post("/message", validate(sendChatMessageSchema), sendChatMessage);
router.get("/history", getTriageHistory);
router.get("/history/:sessionId", getTriageSessionDetails);
router.delete("/history/:sessionId", validate(deleteSessionSchema), deleteTriageSession);
router.get("/details/:triageSessionId", validate(triageDetailsSchema), getTriageSessionDetails);

export default router;

