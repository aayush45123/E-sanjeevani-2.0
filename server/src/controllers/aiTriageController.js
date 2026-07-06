import axios from "axios";
import { db } from "../config/neonDb.js";

import { aiTriageChats } from "../db/schema/index.js";

export const predictDisease = async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Symptoms message is required",
      });
    }

    // Detailed request logs removed to reduce noise

    // Call Python Flask API
    const aiResponse = await axios.post("http://127.0.0.1:8000/predict", {
      message,
    });

    // Response logging removed to reduce noise

    const result = aiResponse.data;

    // Extract the actual prediction data from the response
    const predictionData = result.data || result;

    const insertedRows = await db
      .insert(aiTriageChats)
      .values({
        userId,

        symptoms: message,

        predictedDisease: predictionData.predictedDisease,

        urgency: predictionData.urgency,

        doctorType: predictionData.doctorType,

        finalDoctorDiagnosis: "",
      })
      .returning();

    const savedChat = insertedRows[0];

    // saved chat persisted

    // Return the properly formatted response
    return res.status(200).json({
      success: true,
      data: {
        predictedDisease: predictionData.predictedDisease,
        confidence: predictionData.confidence,
        urgency: predictionData.urgency,
        urgencyScore: predictionData.urgencyScore,
        doctorType: predictionData.doctorType,
        topPredictions: predictionData.topPredictions,
        summary: predictionData.summary,
      },
    });
  } catch (error) {
    console.error("❌ AI TRIAGE ERROR:", error.message);
    console.error("Error details:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "AI Triage Prediction Failed",
      error: error.message,
    });
  }
};
