import axios from "axios";
import AITriageChat from "../models/AITriageChat.js";

export const predictDisease = async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Symptoms message is required",
      });
    }

    console.log(
      "🔍 Calling Python AI Service with message:",
      message.substring(0, 50) + "...",
    );

    // Call Python Flask API
    const aiResponse = await axios.post("http://127.0.0.1:8000/predict", {
      message,
    });

    console.log(
      "✅ Python API Response:",
      JSON.stringify(aiResponse.data).substring(0, 200),
    );

    const result = aiResponse.data;

    // Extract the actual prediction data from the response
    const predictionData = result.data || result;

    // Save to MongoDB
    const savedChat = await AITriageChat.create({
      userId,
      symptoms: message,
      predictedDisease: predictionData.predictedDisease,
      urgency: predictionData.urgency,
      doctorType: predictionData.doctorType,
      finalDoctorDiagnosis: "",
    });

    console.log("💾 Saved to MongoDB with urgency:", predictionData.urgency);

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
