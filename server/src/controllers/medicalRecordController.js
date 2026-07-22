import { MedicalRecordService } from "../services/medicalRecord.service.js";

export const addPatientRecord = async (req, res) => {
  try {
    const patientId = req.user.id;
    const {
      recordTitle,
      recordDate,
      doctorName,
      hospitalName,
      diagnosis,
      prescription,
      doctorNotes,
    } = req.body;

    const files = req.files || [];

    const record = await MedicalRecordService.addPatientRecord({
      patientId,
      recordTitle,
      recordDate,
      doctorName,
      hospitalName,
      diagnosis,
      prescription,
      doctorNotes,
      files,
    });

    return res.status(201).json({
      success: true,
      message: "Historical medical record added successfully",
      record,
    });
  } catch (error) {
    console.error("Error in addPatientRecord controller:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to add medical record",
    });
  }
};

export const getMyMedicalRecords = async (req, res) => {
  try {
    const patientId = req.user.id;
    const records = await MedicalRecordService.getPatientRecords(patientId);

    return res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error("Error in getMyMedicalRecords controller:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch medical records",
    });
  }
};

export const getMedicalRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const record = await MedicalRecordService.getRecordById(id, userId);

    return res.status(200).json({
      success: true,
      record,
    });
  } catch (error) {
    console.error("Error in getMedicalRecordById controller:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch medical record",
    });
  }
};

export const getRecordByConsultation = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const record = await MedicalRecordService.getRecordByConsultation(consultationId);

    return res.status(200).json({
      success: true,
      record: record || null,
    });
  } catch (error) {
    console.error("Error in getRecordByConsultation controller:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch consultation medical record",
    });
  }
};

export const issuePrescription = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const {
      consultationId,
      diagnosis,
      prescriptionItems,
      advice,
      recommendedTests,
      followUpRequired,
      followUpDays,
      doctorNotes,
    } = req.body;

    if (!consultationId) {
      return res.status(400).json({
        success: false,
        message: "consultationId is required",
      });
    }

    const record = await MedicalRecordService.issuePrescription({
      consultationId,
      doctorId,
      diagnosis,
      prescriptionItems: prescriptionItems || [],
      advice,
      recommendedTests,
      followUpRequired,
      followUpDays,
      doctorNotes,
    });

    return res.status(200).json({
      success: true,
      message: "Digital prescription issued and PDF generated successfully",
      record,
    });
  } catch (error) {
    console.error("Error in issuePrescription controller:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to issue digital prescription",
    });
  }
};
