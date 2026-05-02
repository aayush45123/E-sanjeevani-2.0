import express from "express";
import * as triageController from "../controllers/triageController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Protect all triage routes with authentication
router.use(authMiddleware);

// Create a new triage session
router.post("/create", triageController.createTriageSession);

// Process triage and get AI response
router.post(
  "/process/:triageSessionId",
  triageController.processTriageResponse,
);

// Get patient's triage history (summaries)
router.get("/history", triageController.getTriageHistory);

// Get specific triage session details
router.get(
  "/details/:triageSessionId",
  triageController.getTriageSessionDetails,
);

export default router;
