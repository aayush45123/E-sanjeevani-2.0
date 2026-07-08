import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { predictDisease } from "../controllers/aiTriageController.js";
import { validate } from "../validators/validation.middleware.js";
import { predictDiseaseSchema } from "../validators/aiTriage.validator.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/predict", validate(predictDiseaseSchema), predictDisease);

export default router;
