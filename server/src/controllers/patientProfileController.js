import { PatientProfileService } from "../services/patientProfile.service.js";

const handleControllerError = (res, err, defaultMessage) => {
  console.error(`[PatientProfileController]`, err);
  if (err.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "A profile already exists for this user",
    });
  }
  if (err.code === "22P02" || err.code === "23502") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      error: err.message,
    });
  }
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || defaultMessage,
    errors: err.errors,
  });
};

export const createProfile = async (req, res) => {
  try {
    const result = await PatientProfileService.createProfile(
      req.user.id,
      req.user.role,
      req.body,
    );
    return res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to create profile");
  }
};

export const getProfile = async (req, res) => {
  try {
    const result = await PatientProfileService.getProfile(req.user.id, req.user.role);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch profile");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const result = await PatientProfileService.updateProfile(
      req.user.id,
      req.user.role,
      req.body,
    );
    return res.status(200).json({
      success: true,
      message: "Profile saved successfully",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to update profile");
  }
};

export const getProfileStatus = async (req, res) => {
  try {
    const result = await PatientProfileService.getProfileStatus(req.user.id, req.user.role);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to get profile status");
  }
};
