import { predictTriageDisease } from "../ai/aiTriageClient.js";
import { AiTriageRepository } from "../repositories/aiTriage.repository.js";

export class AiTriageService {
  static async predictDisease(userId, { message }) {
    if (!userId) {
      throw { status: 401, message: "Authentication required" };
    }

    if (!message) {
      throw { status: 400, message: "Symptoms message is required" };
    }

    let aiResponse;
    try {
      aiResponse = await predictTriageDisease(message);
    } catch (err) {
      console.error("AI service request failed:", err.message);
      throw {
        status: 503,
        message: "AI service unavailable",
        error: err.message,
      };
    }

    const result = aiResponse.data;
    const predictionData = result.data || result;

    await AiTriageRepository.createChat({
      userId,
      symptoms: message,
      predictedDisease: predictionData.predictedDisease,
      urgency: predictionData.urgency,
      doctorType: predictionData.doctorType,
      finalDoctorDiagnosis: "",
    });

    return {
      predictedDisease: predictionData.predictedDisease,
      confidence: predictionData.confidence,
      urgency: predictionData.urgency,
      urgencyScore: predictionData.urgencyScore,
      doctorType: predictionData.doctorType,
      topPredictions: predictionData.topPredictions,
      summary: predictionData.summary,
    };
  }
}
