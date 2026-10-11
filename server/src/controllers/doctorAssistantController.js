import { DoctorAssistantService } from "../services/doctorAssistant.service.js";

export const getDoctorAssistantData = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const data = await DoctorAssistantService.getDoctorAssistantData(consultationId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Doctor assistant controller error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch doctor assistant data",
      error: error.error || error.message,
    });
  }
};

export const chatWithDoctorAssistant = async (req, res) => {
  try {
    const { consultationId, query, history } = req.body;
    const doctorId = req.user.id;
    const result = await DoctorAssistantService.chatWithDoctorAssistant(
      doctorId,
      consultationId,
      query,
      history || [],
    );
    return res.status(200).json({
      success: true,
      message: "Clinical assistant recommendation generated",
      data: result,
    });
  } catch (error) {
    console.error("Doctor assistant chat error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to get AI assistant advice",
      error: error.error || error.message,
    });
  }
};
