import { DoctorProfileService } from "../services/doctorProfile.service.js";

export const createOrUpdateDoctorProfile = async (req, res) => {
  try {
    const profile = await DoctorProfileService.createOrUpdateDoctorProfile(
      req.user.id,
      req.user.role,
      req.body,
    );
    return res.status(200).json({
      success: true,
      message: "Doctor profile saved successfully",
      profile,
    });
  } catch (error) {
    console.error("Create/update doctor profile controller error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to create or update doctor profile",
      error: error.error || error.message,
    });
  }
};

export const getDoctorProfile = async (req, res) => {
  try {
    const profile = await DoctorProfileService.getDoctorProfile(req.user.id, req.user.role);
    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Get doctor profile controller error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch doctor profile",
      error: error.error || error.message,
    });
  }
};

export const checkDoctorProfileStatus = async (req, res) => {
  try {
    const result = await DoctorProfileService.checkDoctorProfileStatus(req.user.id, req.user.role);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Check doctor profile status controller error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to check profile status",
      error: error.error || error.message,
    });
  }
};
