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
