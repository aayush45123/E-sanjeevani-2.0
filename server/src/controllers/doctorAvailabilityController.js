import { AvailabilityService } from "../services/availability.service.js";

export const createDoctorAvailability = async (req, res) => {
  try {
    const { created, availability } = await AvailabilityService.createDoctorAvailability(
      req.user.id,
      req.user.role,
      req.body,
    );
    return res.status(created ? 201 : 200).json({
      success: true,
      message: created ? "Availability created successfully" : "Availability updated successfully",
      availability,
    });
  } catch (error) {
    console.error("Create availability controller error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to create doctor availability",
      error: error.error || error.message,
    });
  }
};

export const getDoctorOwnAvailability = async (req, res) => {
  try {
    const availability = await AvailabilityService.getDoctorOwnAvailability(
      req.user.id,
      req.user.role,
    );
    return res.status(200).json({
      success: true,
      availability,
    });
  } catch (error) {
    console.error("Get doctor availability controller error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch doctor availability",
      error: error.error || error.message,
    });
  }
};

export const getDoctorAvailabilitySlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    const result = await AvailabilityService.getDoctorAvailabilitySlots(doctorId, date);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get availability slots controller error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch doctor slots",
      error: error.error || error.message,
    });
  }
};

export const deleteDoctorAvailability = async (req, res) => {
  try {
    const { availabilityId } = req.params;
    const result = await AvailabilityService.deleteDoctorAvailability(
      req.user.id,
      req.user.role,
      availabilityId,
    );
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Delete availability controller error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to delete availability",
      error: error.error || error.message,
    });
  }
};
