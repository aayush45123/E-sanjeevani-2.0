import { and, desc, eq } from "drizzle-orm";
import { db } from "../config/neonDb.js";
import {
  medicalRecords,
  medicalRecordAttachments,
  prescriptionItems,
  consultations,
  users,
  doctorProfiles,
} from "../database/schema/index.js";

export class MedicalRecordRepository {
  static async createPatientRecord(data) {
    const result = await db
      .insert(medicalRecords)
      .values({
        patientId: data.patientId,
        consultationId: null,
        source: "patient_upload",
        recordTitle: data.recordTitle,
        recordDate: data.recordDate ? new Date(data.recordDate) : new Date(),
        doctorName: data.doctorName || "",
        hospitalName: data.hospitalName || "",
        diagnosis: data.diagnosis || "",
        prescription: data.prescription || "",
        doctorNotes: data.doctorNotes || "",
      })
      .returning();

    return result[0];
  }

  static async createAttachment({ medicalRecordId, fileName, fileUrl }) {
    const result = await db
      .insert(medicalRecordAttachments)
      .values({
        medicalRecordId,
        fileName,
        fileUrl,
      })
      .returning();

    return result[0];
  }

  static async createOrUpdateConsultationRecord(data) {
    const existing = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.consultationId, data.consultationId))
      .limit(1);

    const values = {
      patientId: data.patientId,
      consultationId: data.consultationId,
      source: "consultation",
      doctorName: data.doctorName || "",
      hospitalName: data.hospitalName || "",
      diagnosis: data.diagnosis || "",
      prescription: data.prescriptionText || "",
      doctorNotes: data.doctorNotes || "",
      advice: data.advice || "",
      recommendedTests: data.recommendedTests || "",
      followUpRequired: Boolean(data.followUpRequired),
      followUpDays: data.followUpDays ? parseInt(data.followUpDays, 10) : null,
      prescriptionPdfUrl: data.prescriptionPdfUrl || "",
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      const updated = await db
        .update(medicalRecords)
        .set(values)
        .where(eq(medicalRecords.id, existing[0].id))
        .returning();

      return updated[0];
    } else {
      const inserted = await db
        .insert(medicalRecords)
        .values({
          ...values,
          recordTitle: `Consultation Prescription — Dr. ${data.doctorName || "Specialist"}`,
          recordDate: new Date(),
        })
        .returning();

      return inserted[0];
    }
  }

  static async savePrescriptionItems(medicalRecordId, items = []) {
    // Delete existing items for this record
    await db
      .delete(prescriptionItems)
      .where(eq(prescriptionItems.medicalRecordId, medicalRecordId));

    if (!items || items.length === 0) return [];

    const valuesToInsert = items.map((item) => ({
      medicalRecordId,
      medicineName: item.medicineName,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      instructions: item.instructions || "",
    }));

    return db.insert(prescriptionItems).values(valuesToInsert).returning();
  }

  static async findByPatientId(patientId) {
    const records = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.patientId, patientId))
      .orderBy(desc(medicalRecords.recordDate));

    // Hydrate each record with attachments and items
    const hydratedRecords = await Promise.all(
      records.map(async (record) => {
        const attachments = await db
          .select()
          .from(medicalRecordAttachments)
          .where(eq(medicalRecordAttachments.medicalRecordId, record.id));

        const items = await db
          .select()
          .from(prescriptionItems)
          .where(eq(prescriptionItems.medicalRecordId, record.id));

        return {
          ...record,
          attachments,
          prescriptionItems: items,
        };
      })
    );

    return hydratedRecords;
  }

  static async findById(id) {
    const recordRow = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.id, id))
      .limit(1);

    if (recordRow.length === 0) return null;
    const record = recordRow[0];

    const attachments = await db
      .select()
      .from(medicalRecordAttachments)
      .where(eq(medicalRecordAttachments.medicalRecordId, record.id));

    const items = await db
      .select()
      .from(prescriptionItems)
      .where(eq(prescriptionItems.medicalRecordId, record.id));

    return {
      ...record,
      attachments,
      prescriptionItems: items,
    };
  }

  static async findByConsultationId(consultationId) {
    const recordRow = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.consultationId, consultationId))
      .limit(1);

    if (recordRow.length === 0) return null;
    const record = recordRow[0];

    const attachments = await db
      .select()
      .from(medicalRecordAttachments)
      .where(eq(medicalRecordAttachments.medicalRecordId, record.id));

    const items = await db
      .select()
      .from(prescriptionItems)
      .where(eq(prescriptionItems.medicalRecordId, record.id));

    return {
      ...record,
      attachments,
      prescriptionItems: items,
    };
  }
}
