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

    // Call Python Flask API
    const aiResponse = await axios.post("http://127.0.0.1:8000/predict", {
      message,
    });

    const result = aiResponse.data;

    // Save to MongoDB
    const savedChat = await AITriageChat.create({
      userId,
      symptoms: message,
      predictedDisease: result.predictedDisease,
      urgency: result.urgency,
      doctorType: result.doctorType,
      finalDoctorDiagnosis: "",
    });

    return res.status(200).json({
      success: true,
      data: result,
      savedChat,
    });
  } catch (error) {
    console.log("AI TRIAGE ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "AI Triage Prediction Failed",
      error: error.message,
    });
  }
};
