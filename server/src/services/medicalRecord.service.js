import { MedicalRecordRepository } from "../repositories/medicalRecord.repository.js";
import { UserRepository } from "../repositories/user.repository.js";

/**
 * MedicalRecordService
 *
 * Handles SUPPORTING DOCUMENTS only.
 * Prescription logic lives in PrescriptionLifecycleService.
 */
export class MedicalRecordService {
  /** Patient uploads a historical supporting document */
  static async addPatientRecord({
    patientId,
    recordTitle,
    recordType,
    recordDate,
    doctorName,
    hospitalName,
    description,
    files = [],
  }) {
    if (!recordTitle) throw { status: 400, message: "Record title is required" };

    const record = await MedicalRecordRepository.createRecord({
      patientId,
      source: "patient_upload",
      uploadedBy: "patient",
      recordTitle,
      recordType: recordType || "other",
      recordDate,
      doctorName,
      hospitalName,
      description,
    });

    // Save attachments if any files uploaded
    const attachments = [];
    for (const file of files) {
      const fileUrl = `/uploads/attachments/${file.filename}`;
      const attachment = await MedicalRecordRepository.createAttachment({
        medicalRecordId: record.id,
        fileName: file.originalname,
        fileUrl,
      });
      attachments.push(attachment);
    }

    return { ...record, attachments };
  }

  static async getPatientRecords(patientId) {
    return MedicalRecordRepository.findByPatientId(patientId);
  }

  static async getDoctorRecords(doctorId) {
    return MedicalRecordRepository.findByDoctorId(doctorId);
  }

  static async getRecordById(id, userId) {
    const record = await MedicalRecordRepository.findById(id);
    if (!record) throw { status: 404, message: "Medical record not found" };

    // Authorization: patient owns it OR doctor can view
    if (record.patientId !== userId) {
      const user = await UserRepository.findById(userId);
      if (user?.role !== "doctor") {
        throw { status: 403, message: "Access denied to this medical record" };
      }
    }

    return record;
  }

  static async getRecordsByConsultation(consultationId) {
    return MedicalRecordRepository.findByConsultationId(consultationId);
  }
}
