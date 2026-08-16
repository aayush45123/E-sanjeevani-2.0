import { MedicalRecordRepository } from "../repositories/medicalRecord.repository.js";
import { ConsultationRepository } from "../repositories/consultation.repository.js";
import { DoctorProfileRepository } from "../repositories/doctorProfile.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { PrescriptionPdfService } from "./prescriptionPdfService.js";

export class MedicalRecordService {
  static async addPatientRecord({
    patientId,
    recordTitle,
    recordDate,
    doctorName,
    hospitalName,
    diagnosis,
    prescription,
    doctorNotes,
    files = [],
  }) {
    if (!recordTitle) {
      throw { status: 400, message: "Record title is required" };
    }

    const record = await MedicalRecordRepository.createPatientRecord({
      patientId,
      recordTitle,
      recordDate,
      doctorName,
      hospitalName,
      diagnosis,
      prescription,
      doctorNotes,
    });

    const attachments = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const fileUrl = `/uploads/attachments/${file.filename}`;
        const attachment = await MedicalRecordRepository.createAttachment({
          medicalRecordId: record.id,
          fileName: file.originalname,
          fileUrl,
        });
        attachments.push(attachment);
      }
    }

    return {
      ...record,
      attachments,
      prescriptionItems: [],
    };
  }

  static async getPatientRecords(patientId) {
    return MedicalRecordRepository.findByPatientId(patientId);
  }

  static async getDoctorRecords(doctorId) {
    return MedicalRecordRepository.findByDoctorId(doctorId);
  }

  static async getRecordById(id, userId) {
    const record = await MedicalRecordRepository.findById(id);
    if (!record) {
      throw { status: 404, message: "Medical record not found" };
    }

    // Security check: patient or doctor associated can view
    if (record.patientId !== userId) {
      // Check if user is a doctor
      const user = await UserRepository.findById(userId);
      if (user?.role !== "doctor") {
        throw { status: 403, message: "Access denied to this medical record" };
      }
    }

    return record;
  }

  static async getRecordByConsultation(consultationId) {
    return MedicalRecordRepository.findByConsultationId(consultationId);
  }

  static async issuePrescription({
    consultationId,
    doctorId,
    diagnosis,
    prescriptionItems = [],
    advice,
    recommendedTests,
    followUpRequired,
    followUpDays,
    doctorNotes,
  }) {
    // 1. Fetch consultation
    const consultation = await ConsultationRepository.findById(consultationId);
    if (!consultation) {
      throw { status: 404, message: "Consultation session not found" };
    }

    // 2. Validate doctor authorization
    if (consultation.doctorId !== doctorId) {
      throw { status: 403, message: "Only the assigned doctor can issue a prescription" };
    }

    // 3. Fetch Doctor details & Doctor profile
    const doctorUser = await UserRepository.findById(doctorId);
    const doctorProfileObj = await DoctorProfileRepository.findByUserId(doctorId);
    const doctorProfile = doctorProfileObj?.profile || {};

    const doctorData = {
      name: doctorUser?.name || "Doctor",
      specialization: doctorProfile.specialization || "General Physician",
      qualification: doctorProfile.qualification || "MBBS",
      medicalRegistrationNumber: doctorProfile.medicalRegistrationNumber || "VERIFIED-MCI",
      hospitalName: doctorProfile.hospitalName || "E-Sanjeevani Healthcare",
    };

    // 4. Fetch Patient details
    const patientUser = await UserRepository.findById(consultation.patientId);
    const patientData = {
      name: patientUser?.name || "Patient",
      gender: "N/A",
      age: "N/A",
    };

    // Construct text representation of prescription items for backup
    const prescriptionText = prescriptionItems
      .map(
        (item) =>
          `${item.medicineName} ${item.dosage} — ${item.frequency} for ${item.duration} (${item.instructions || "After food"})`
      )
      .join("\n");

    // 5. Create or Update Medical Record
    const record = await MedicalRecordRepository.createOrUpdateConsultationRecord({
      patientId: consultation.patientId,
      consultationId,
      doctorName: `Dr. ${doctorData.name}`,
      hospitalName: doctorData.hospitalName,
      diagnosis,
      prescriptionText,
      doctorNotes,
      advice,
      recommendedTests,
      followUpRequired,
      followUpDays,
    });

    // 6. Save Structured Prescription Items
    const savedItems = await MedicalRecordRepository.savePrescriptionItems(
      record.id,
      prescriptionItems
    );

    // 7. Generate PDF Document
    const pdfUrl = await PrescriptionPdfService.generatePrescriptionPdf({
      recordId: record.id,
      consultationId: consultation.id,
      recordDate: new Date().toLocaleDateString("en-IN"),
      doctor: doctorData,
      patient: patientData,
      diagnosis,
      prescriptionItems,
      advice,
      recommendedTests,
      followUpRequired,
      followUpDays,
      doctorNotes,
    });

    // 8. Update Record with PDF URL & Save Attachment reference
    const updatedRecord = await MedicalRecordRepository.createOrUpdateConsultationRecord({
      patientId: consultation.patientId,
      consultationId,
      doctorName: `Dr. ${doctorData.name}`,
      hospitalName: doctorData.hospitalName,
      diagnosis,
      prescriptionText,
      doctorNotes,
      advice,
      recommendedTests,
      followUpRequired,
      followUpDays,
      prescriptionPdfUrl: pdfUrl,
    });

    await MedicalRecordRepository.createAttachment({
      medicalRecordId: record.id,
      fileName: `Digital_Prescription_${consultation.id.slice(0, 8)}.pdf`,
      fileUrl: pdfUrl,
    });

    // 9. Update Consultation notes / diagnosis as well
    await ConsultationRepository.updateNotes(consultationId, doctorId, {
      diagnosis,
      prescription: prescriptionText,
      doctorNotes,
    });

    return {
      ...updatedRecord,
      prescriptionItems: savedItems,
      prescriptionPdfUrl: pdfUrl,
    };
  }
}
