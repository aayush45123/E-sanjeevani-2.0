import { AiTriageService } from "../services/aiTriage.service.js";

export const predictDisease = async (req, res) => {
  try {
    const result = await AiTriageService.predictDisease(req.user?.id, req.body);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("AI Triage controller error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "AI Triage Prediction Failed",
      error: error.error || error.message,
    });
  }
};
