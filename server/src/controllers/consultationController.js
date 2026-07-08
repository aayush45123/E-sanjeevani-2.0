import { ConsultationService } from "../services/consultation.service.js";

const handleControllerError = (res, error, defaultMessage) => {
  console.error(defaultMessage, error);
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }
  if (error.code === "22P02") {
    return res.status(400).json({
      success: false,
      message: "Invalid consultation data or status format",
    });
  }
  return res.status(error.status || 500).json({
    success: false,
    message: error.message || defaultMessage,
    error: error.error || error.message,
  });
};

export const getAvailableDoctors = async (req, res) => {
  try {
    const result = await ConsultationService.getAvailableDoctors(req.query);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch doctors");
  }
};

export const getDoctorAvailableSlots = async (req, res) => {
  try {
    const slots = await ConsultationService.getDoctorAvailableSlots(req.query);
    return res.status(200).json({
      success: true,
      slots,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch doctor slots");
  }
};

export const createConsultation = async (req, res) => {
  try {
    const result = await ConsultationService.createConsultation(
      req.user.id,
      req.user.role,
      req.body,
    );
    return res.status(201).json({
      success: true,
      message: "Consultation booked successfully",
      consultation: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to create consultation");
  }
};

export const getDoctorConsultations = async (req, res) => {
  try {
    const consultationsList = await ConsultationService.getDoctorConsultations(
      req.user.id,
      req.user.role,
    );
    return res.status(200).json({
      success: true,
      consultations: consultationsList,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch doctor consultations");
  }
};

export const getPatientConsultations = async (req, res) => {
  try {
    const consultationsList = await ConsultationService.getPatientConsultations(
      req.user.id,
      req.user.role,
    );
    return res.status(200).json({
      success: true,
      consultations: consultationsList,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch patient consultations");
  }
};

export const getDoctorsNearMe = async (req, res) => {
  try {
    const doctors = await ConsultationService.getDoctorsNearMe(req.query);
    return res.status(200).json({
      success: true,
      doctors,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch nearby doctors");
  }
};

export const updateConsultationStatus = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { status } = req.body;
    const result = await ConsultationService.updateConsultationStatus(
      req.user.id,
      req.user.role,
      consultationId,
      status,
    );
    return res.status(200).json({
      success: true,
      message: "Consultation status updated successfully",
      consultation: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to update consultation status");
  }
};

export const addDoctorNotes = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const result = await ConsultationService.addDoctorNotes(
      req.user.id,
      req.user.role,
      consultationId,
      req.body,
    );
    return res.status(200).json({
      success: true,
      message: "Doctor notes updated successfully",
      consultation: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to update doctor notes");
  }
};

export const markUserJoined = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const result = await ConsultationService.markUserJoined(
      req.user.id,
      req.user.role,
      consultationId,
    );
    return res.status(200).json({
      success: true,
      message: `${req.user.role} marked as joined`,
      consultation: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to update meeting join status");
  }
};
