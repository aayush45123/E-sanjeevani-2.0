import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createTriageSession,
  processTriageResponse,
  getTriageHistory,
  getTriageSessionDetails,
} from "../controllers/triageController.js";
import { validate } from "../validators/validation.middleware.js";
import {
  createTriageSessionSchema,
  processTriageSchema,
  triageDetailsSchema,
} from "../validators/triage.validator.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/create", validate(createTriageSessionSchema), createTriageSession);
router.post("/process/:triageSessionId", validate(processTriageSchema), processTriageResponse);
router.get("/history", getTriageHistory);
router.get("/details/:triageSessionId", validate(triageDetailsSchema), getTriageSessionDetails);

export default router;
