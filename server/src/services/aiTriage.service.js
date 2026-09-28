import { predictTriageDisease } from "../ai/aiTriageClient.js";
import { AiTriageRepository } from "../repositories/aiTriage.repository.js";
import {
  getHomemadeRemediesText,
  getTopDoctorRecommendation,
} from "../helpers/remediesAndDoctorRecommender.js";

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
    const disease = predictionData.predictedDisease || "General Assessment";
    const urgency = predictionData.urgency || "Moderate";
    const doctorType = predictionData.doctorType || "General Physician";

    const remediesText = getHomemadeRemediesText(disease, urgency);
    let recommendedDoctorText = null;
    try {
      recommendedDoctorText = await getTopDoctorRecommendation(doctorType);
    } catch (docErr) {
      console.warn("Could not fetch top recommended doctor:", docErr);
    }

    await AiTriageRepository.createChat({
      userId,
      symptoms: message,
      predictedDisease: disease,
      urgency: urgency,
      doctorType: doctorType,
      finalDoctorDiagnosis: "",
    });

    return {
      predictedDisease: disease,
      confidence: predictionData.confidence,
      urgency: urgency,
      urgencyScore: predictionData.urgencyScore,
      doctorType: doctorType,
      topPredictions: predictionData.topPredictions,
      summary: predictionData.summary,
      remedies: remediesText,
      recommendedDoctor: recommendedDoctorText,
    };
  }
}
