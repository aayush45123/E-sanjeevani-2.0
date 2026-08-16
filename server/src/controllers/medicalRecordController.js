import { MedicalRecordService } from "../services/medicalRecord.service.js";
import { PrescriptionLifecycleService } from "../services/prescriptionLifecycle.service.js";

// ─── PATIENT UPLOAD A SUPPORTING DOCUMENT ────────────────────────────────────

export const addPatientRecord = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { recordTitle, recordType, recordDate, doctorName, hospitalName, description } =
      req.body;
    const files = req.files || [];

    const record = await MedicalRecordService.addPatientRecord({
      patientId,
      recordTitle,
      recordType,
      recordDate,
      doctorName,
      hospitalName,
      description,
      files,
    });

    return res.status(201).json({
      success: true,
      message: "Medical record added successfully",
      record,
    });
  } catch (error) {
    console.error("addPatientRecord error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to add medical record",
    });
  }
};

// ─── GET MY RECORDS ───────────────────────────────────────────────────────────

export const getMyMedicalRecords = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const records =
      role === "doctor"
        ? await MedicalRecordService.getDoctorRecords(userId)
        : await MedicalRecordService.getPatientRecords(userId);

    return res.status(200).json({ success: true, count: records.length, records });
  } catch (error) {
    console.error("getMyMedicalRecords error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch records",
    });
  }
};

// ─── GET RECORD BY ID ─────────────────────────────────────────────────────────

export const getMedicalRecordById = async (req, res) => {
  try {
    const record = await MedicalRecordService.getRecordById(req.params.id, req.user.id);
    return res.status(200).json({ success: true, record });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch record",
    });
  }
};

// ─── GET RECORDS BY CONSULTATION ─────────────────────────────────────────────

export const getRecordByConsultation = async (req, res) => {
  try {
    const records = await MedicalRecordService.getRecordsByConsultation(
      req.params.consultationId
    );
    return res.status(200).json({ success: true, records });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch consultation records",
    });
  }
};

// ─── ISSUE PRESCRIPTION (legacy endpoint — routes to lifecycle service) ────────

export const issuePrescription = async (req, res) => {
  try {
    const doctorId = req.user.id;
    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Doctor access only" });
    }

    const {
      consultationId,
      diagnosis,
      prescriptionItems: items,
      advice,
      recommendedTests,
      referralInfo,
      followUpInstructions,
      followUpRequired,
      followUpDays,
      doctorNotes,
    } = req.body;

    if (!consultationId) {
      return res.status(400).json({ success: false, message: "consultationId is required" });
    }

    const prescription = await PrescriptionLifecycleService.issuePrescription({
      consultationId,
      doctorId,
      diagnosis,
      items: items || [],
      advice,
      recommendedTests,
      referralInfo,
      followUpInstructions,
      followUpRequired,
      followUpDays,
      doctorNotes,
    });

    return res.status(200).json({
      success: true,
      message: "Prescription issued and PDF generated successfully",
      record: prescription, // kept as "record" for VideoCall.jsx backward compat
    });
  } catch (error) {
    console.error("issuePrescription error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to issue prescription",
    });
  }
};
