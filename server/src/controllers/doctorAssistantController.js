import Consultation from "../models/Consultation.js";
import PatientProfile from "../models/PatientProfile.js";
import User from "../models/User.js";
import AITriageChat from "../models/AITriageChat.js";

export const getDoctorAssistantData = async (req, res) => {
  try {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId)
      .populate("patient", "-password")
      .populate("doctor", "-password");

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    const patientId = consultation.patient?._id;

    const patientProfile = await PatientProfile.findOne({
      userId: patientId,
    });

    const latestAITriage = await AITriageChat.findOne({
      userId: patientId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        patientBasicInfo: consultation.patient,
        consultationDetails: consultation,
        patientProfile,
        latestAITriage,
      },
    });
  } catch (error) {
    console.log("Doctor Assistant Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor assistant data",
      error: error.message,
    });
  }
};
