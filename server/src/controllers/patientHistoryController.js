import { MedicalRecordService } from "../services/medicalRecord.service.js";
import { PatientHistoryService } from "../services/patientHistory.service.js";

// ─── GET DOCTOR → PATIENT HISTORY ────────────────────────────────────────────

export const getDoctorPatientHistory = async (req, res) => {
  try {
    const { doctorId, patientId } = req.params;
    const { id: requesterId, role } = req.user;

    // Only the authenticated doctor whose id matches doctorId may request this
    if (role !== "doctor") {
      return res.status(403).json({ success: false, message: "Doctor access only" });
    }
    if (requesterId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: "You may only access history for your own patients",
      });
    }

    // Verify this doctor has an existing consultation with this patient
    const hasRelationship = await PatientHistoryService.verifyDoctorPatientRelationship(
      doctorId,
      patientId
    );
    if (!hasRelationship) {
      return res.status(403).json({
        success: false,
        message: "No consultation relationship found with this patient",
      });
    }

    const history = await PatientHistoryService.getPatientHistory(patientId, doctorId);

    return res.status(200).json({ success: true, history });
  } catch (error) {
    console.error("getDoctorPatientHistory error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch patient history",
    });
  }
};

// ─── GET DOCTOR → PATIENT ANALYTICS ──────────────────────────────────────────

export const getDoctorPatientAnalytics = async (req, res) => {
  try {
    const { doctorId, patientId } = req.params;
    const { id: requesterId, role } = req.user;

    if (role !== "doctor") {
      return res.status(403).json({ success: false, message: "Doctor access only" });
    }
    if (requesterId !== doctorId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const hasRelationship = await PatientHistoryService.verifyDoctorPatientRelationship(
      doctorId,
      patientId
    );
    if (!hasRelationship) {
      return res.status(403).json({
        success: false,
        message: "No consultation relationship found with this patient",
      });
    }

    const analytics = await PatientHistoryService.getPatientAnalytics(patientId, doctorId);

    return res.status(200).json({ success: true, analytics });
  } catch (error) {
    console.error("getDoctorPatientAnalytics error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch patient analytics",
    });
  }
};

// ─── GET PATIENT OWN CLINICAL RECORDS ────────────────────────────────────────

export const getPatientClinicalRecords = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { id: requesterId, role } = req.user;

    // Patients can only access their own records
    if (role === "patient" && requesterId !== patientId) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own clinical records",
      });
    }

    // Doctors need a relationship check
    if (role === "doctor") {
      const hasRelationship = await PatientHistoryService.verifyDoctorPatientRelationship(
        requesterId,
        patientId
      );
      if (!hasRelationship) {
        return res.status(403).json({
          success: false,
          message: "No consultation relationship found with this patient",
        });
      }
    }

    const history = await PatientHistoryService.getPatientHistory(
      patientId,
      role === "doctor" ? requesterId : null
    );

    return res.status(200).json({
      success: true,
      patientOverview: history.patientOverview,
      prescriptions: history.prescriptions,
      documents: history.documents,
      timeline: history.timeline,
    });
  } catch (error) {
    console.error("getPatientClinicalRecords error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch clinical records",
    });
  }
};

// ─── ADD SUPPORTING DOCUMENT (patient upload) ─────────────────────────────────

export const addClinicalRecord = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { id: requesterId, role } = req.user;

    // Only the patient themselves can upload their own documents
    if (role === "patient" && requesterId !== patientId) {
      return res.status(403).json({
        success: false,
        message: "You can only add records to your own profile",
      });
    }

    const { recordTitle, recordType, recordDate, doctorName, hospitalName, description } =
      req.body;
    const files = req.files || [];

    const record = await MedicalRecordService.addPatientRecord({
      patientId: patientId || requesterId,
      recordTitle: recordTitle || "Medical Record",
      recordType: recordType || "other",
      recordDate,
      doctorName,
      hospitalName,
      description,
      files,
    });

    return res.status(201).json({
      success: true,
      message: "Supporting document added successfully",
      record,
    });
  } catch (error) {
    console.error("addClinicalRecord error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to add clinical record",
    });
  }
};

// ─── GET SINGLE CLINICAL RECORD ───────────────────────────────────────────────

export const getClinicalRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await MedicalRecordService.getRecordById(id, req.user.id);
    return res.status(200).json({ success: true, record });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch record",
    });
  }
};
