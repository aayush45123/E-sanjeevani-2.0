import { and, desc, eq } from "drizzle-orm";
import { db } from "../config/neonDb.js";
import {
  medicalRecords,
  medicalRecordAttachments,
  consultations,
  users,
} from "../database/schema/index.js";

/**
 * MedicalRecordRepository
 *
 * Handles SUPPORTING DOCUMENTS only (lab reports, scans, certificates, etc.).
 * Prescription data lives in PrescriptionRepository.
 */
export class MedicalRecordRepository {
  // ─── CREATE ──────────────────────────────────────────────────────────────────

  /** Patient or doctor uploads a supporting document */
  static async createRecord(data) {
    const [record] = await db
      .insert(medicalRecords)
      .values({
        patientId: data.patientId,
        consultationId: data.consultationId || null,
        prescriptionId: data.prescriptionId || null,
        source: data.source || "patient_upload",
        recordTitle: data.recordTitle || "Medical Record",
        recordType: data.recordType || "other",
        description: data.description || "",
        uploadedBy: data.uploadedBy || "patient",
        recordDate: data.recordDate ? new Date(data.recordDate) : new Date(),
        doctorName: data.doctorName || "",
        hospitalName: data.hospitalName || "",
        updatedAt: new Date(),
      })
      .returning();

    return record;
  }

  /** Create a consultation-linked document record (e.g. consultation summary) */
  static async createConsultationRecord(data) {
    // Check if one already exists for this consultation
    const existing = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.consultationId, data.consultationId))
      .limit(1);

    const values = {
      patientId: data.patientId,
      consultationId: data.consultationId,
      prescriptionId: data.prescriptionId || null,
      source: "consultation",
      recordTitle: data.recordTitle || `Consultation Record`,
      recordType: "other",
      description: data.description || "",
      uploadedBy: "doctor",
      doctorName: data.doctorName || "",
      hospitalName: data.hospitalName || "",
      recordDate: data.recordDate ? new Date(data.recordDate) : new Date(),
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      const [updated] = await db
        .update(medicalRecords)
        .set(values)
        .where(eq(medicalRecords.id, existing[0].id))
        .returning();
      return updated;
    }

    const [inserted] = await db.insert(medicalRecords).values(values).returning();
    return inserted;
  }

  /** Attach a file to a medical record */
  static async createAttachment({ medicalRecordId, fileName, fileUrl }) {
    const [attachment] = await db
      .insert(medicalRecordAttachments)
      .values({ medicalRecordId, fileName, fileUrl })
      .returning();
    return attachment;
  }

  // ─── QUERIES ─────────────────────────────────────────────────────────────────

  static async findByPatientId(patientId) {
    const records = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.patientId, patientId))
      .orderBy(desc(medicalRecords.recordDate));

    return Promise.all(records.map((r) => this._hydrate(r)));
  }

  static async findByDoctorId(doctorId) {
    const rows = await db
      .select({ record: medicalRecords, patientName: users.name })
      .from(medicalRecords)
      .innerJoin(consultations, eq(medicalRecords.consultationId, consultations.id))
      .leftJoin(users, eq(medicalRecords.patientId, users.id))
      .where(eq(consultations.doctorId, doctorId))
      .orderBy(desc(medicalRecords.recordDate));

    return Promise.all(
      rows.map(async ({ record, patientName }) => ({
        ...(await this._hydrate(record)),
        patientName: patientName || "Patient",
      }))
    );
  }

  static async findById(id) {
    const [record] = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.id, id))
      .limit(1);

    return record ? this._hydrate(record) : null;
  }

  static async findByConsultationId(consultationId) {
    const records = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.consultationId, consultationId));

    return Promise.all(records.map((r) => this._hydrate(r)));
  }

  // ─── PRIVATE ─────────────────────────────────────────────────────────────────

  static async _hydrate(record) {
    const attachments = await db
      .select()
      .from(medicalRecordAttachments)
      .where(eq(medicalRecordAttachments.medicalRecordId, record.id));

    return { ...record, attachments };
  }
}
