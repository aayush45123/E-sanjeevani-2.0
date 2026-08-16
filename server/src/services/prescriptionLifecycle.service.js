import { PrescriptionRepository } from "../repositories/prescription.repository.js";
import { ConsultationRepository } from "../repositories/consultation.repository.js";
import { MedicalRecordRepository } from "../repositories/medicalRecord.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { DoctorProfileRepository } from "../repositories/doctorProfile.repository.js";
import { PrescriptionPdfService } from "./prescriptionPdfService.js";

/**
 * PrescriptionLifecycleService
 *
 * Orchestrates the full prescription lifecycle:
 *   issuePrescription   → creates draft → saves items → generates PDF → finalizes
 *   finalizePrescription → makes record immutable (status = finalized)
 *   amendPrescription   → creates a correction linked to the original
 *   discontinueMedication → marks a single item as discontinued
 */
export class PrescriptionLifecycleService {
  // ─── ISSUE (draft → finalized) ───────────────────────────────────────────────

  static async issuePrescription({
    consultationId,
    doctorId,
    diagnosis,
    items = [],
    advice,
    recommendedTests,
    referralInfo,
    followUpInstructions,
    followUpRequired,
    followUpDays,
    doctorNotes,
  }) {
    // 1. Verify consultation exists and belongs to this doctor
    const consultation = await ConsultationRepository.findById(consultationId);
    if (!consultation) {
      throw { status: 404, message: "Consultation not found" };
    }
    if (consultation.doctorId !== doctorId) {
      throw { status: 403, message: "Only the assigned doctor can issue a prescription" };
    }

    // 2. Gather doctor & patient info for PDF
    const doctorUser = await UserRepository.findById(doctorId);
    const doctorProfileObj = await DoctorProfileRepository.findByUserId(doctorId);
    const doctorProfile = doctorProfileObj?.profile || {};
    const patientUser = await UserRepository.findById(consultation.patientId);

    const doctorData = {
      name: doctorUser?.name || "Doctor",
      specialization: doctorProfile.specialization || "General Physician",
      qualification: doctorProfile.qualification || "MBBS",
      medicalRegistrationNumber: doctorProfile.medicalRegistrationNumber || "VERIFIED-MCI",
      hospitalName: doctorProfile.hospitalName || "E-Sanjeevani Healthcare",
    };

    const patientData = {
      name: patientUser?.name || "Patient",
      gender: "N/A",
      age: "N/A",
    };

    // 3. Create prescription as draft (with items & computed dates)
    const rxDraft = await PrescriptionRepository.create({
      consultationId,
      patientId: consultation.patientId,
      doctorId,
      diagnosis,
      advice,
      recommendedTests,
      referralInfo,
      followUpInstructions,
      followUpRequired,
      followUpDays,
      doctorNotes,
      items,
    });

    // 4. Generate PDF
    let pdfUrl = "";
    try {
      pdfUrl = await PrescriptionPdfService.generatePrescriptionPdf({
        recordId: rxDraft.id,
        consultationId,
        recordDate: new Date().toLocaleDateString("en-IN"),
        doctor: doctorData,
        patient: patientData,
        diagnosis,
        prescriptionItems: items,
        advice,
        recommendedTests,
        referralInfo,
        followUpRequired,
        followUpDays,
        doctorNotes,
      });
    } catch (pdfErr) {
      console.error("⚠️ PDF generation failed (prescription saved without PDF):", pdfErr.message);
    }

    // 5. Finalize — makes the prescription immutable
    const finalized = await PrescriptionRepository.finalize(rxDraft.id, pdfUrl);

    // 6. Create a consultation-level supporting MedicalRecord so the timeline
    //    can reference this prescription
    await MedicalRecordRepository.createConsultationRecord({
      patientId: consultation.patientId,
      consultationId,
      prescriptionId: finalized.id,
      recordTitle: `Prescription — ${diagnosis || "Consultation"}`,
      description: `Prescription issued by Dr. ${doctorData.name}`,
      doctorName: `Dr. ${doctorData.name}`,
      hospitalName: doctorData.hospitalName,
      recordDate: new Date(),
    });

    // 7. Save attachment reference for the PDF
    if (pdfUrl) {
      const fileName = `Digital_Prescription_${consultationId.slice(0, 8)}.pdf`;
      // We link the attachment to the consultation medical record
      const consultationRecords = await MedicalRecordRepository.findByConsultationId(consultationId);
      if (consultationRecords.length > 0) {
        await MedicalRecordRepository.createAttachment({
          medicalRecordId: consultationRecords[0].id,
          fileName,
          fileUrl: pdfUrl,
        });
      }
    }

    // 8. Update consultation notes
    await ConsultationRepository.updateNotes(consultationId, doctorId, {
      diagnosis,
      prescription: items.map((i) => `${i.medicineName} ${i.dosage}`).join(", "),
      doctorNotes,
    });

    return {
      ...finalized,
      items: rxDraft.items,
      pdfUrl,
    };
  }

  // ─── FINALIZE (explicit doctor action) ──────────────────────────────────────

  static async finalizePrescription(prescriptionId, doctorId) {
    const rx = await PrescriptionRepository.findById(prescriptionId);
    if (!rx) throw { status: 404, message: "Prescription not found" };
    if (rx.doctorId !== doctorId) throw { status: 403, message: "Not authorized" };
    if (rx.status === "finalized") throw { status: 400, message: "Already finalized" };

    return PrescriptionRepository.finalize(prescriptionId, rx.pdfUrl);
  }

  // ─── AMEND (correction after finalization) ───────────────────────────────────

  static async amendPrescription(prescriptionId, doctorId, amendData) {
    const rx = await PrescriptionRepository.findById(prescriptionId);
    if (!rx) throw { status: 404, message: "Prescription not found" };
    if (rx.doctorId !== doctorId) throw { status: 403, message: "Not authorized" };
    if (rx.status !== "finalized") {
      throw { status: 400, message: "Only finalized prescriptions can be amended" };
    }

    const newRx = await PrescriptionRepository.amend(prescriptionId, amendData);

    // Generate PDF for amendment if items provided
    if (amendData.items?.length > 0) {
      try {
        const doctorUser = await UserRepository.findById(doctorId);
        const patientUser = await UserRepository.findById(newRx.patientId);
        const pdfUrl = await PrescriptionPdfService.generatePrescriptionPdf({
          recordId: newRx.id,
          consultationId: newRx.consultationId,
          recordDate: new Date().toLocaleDateString("en-IN"),
          doctor: { name: doctorUser?.name || "Doctor" },
          patient: { name: patientUser?.name || "Patient" },
          diagnosis: newRx.diagnosis,
          prescriptionItems: amendData.items,
          advice: newRx.advice,
          referralInfo: newRx.referralInfo,
          followUpRequired: newRx.followUpRequired,
          followUpDays: newRx.followUpDays,
          doctorNotes: `[AMENDMENT] ${newRx.doctorNotes || ""}`,
        });
        await PrescriptionRepository.finalize(newRx.id, pdfUrl);
        return { ...newRx, pdfUrl };
      } catch (e) {
        console.warn("Amendment PDF generation failed:", e.message);
      }
    }

    return newRx;
  }

  // ─── DISCONTINUE MEDICATION ──────────────────────────────────────────────────

  static async discontinueMedication(prescriptionId, itemId, doctorId) {
    const rx = await PrescriptionRepository.findById(prescriptionId);
    if (!rx) throw { status: 404, message: "Prescription not found" };
    if (rx.doctorId !== doctorId) throw { status: 403, message: "Not authorized" };

    const item = rx.items.find((i) => i.id === itemId);
    if (!item) throw { status: 404, message: "Prescription item not found" };

    return PrescriptionRepository.discontinueItem(itemId);
  }
}
