import { and, desc, eq } from "drizzle-orm";
import { db } from "../config/neonDb.js";
import {
  medicalRecords,
  medicalRecordAttachments,
  consultations,
  users,
  prescriptions,
  prescriptionItems,
} from "../database/schema/index.js";

/**
 * MedicalRecordRepository
 *
 * Handles clinical records, supporting documents, and digital prescriptions.
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

    const hydratedRecords = await Promise.all(records.map((r) => this._hydrate(r)));

    // Ensure all prescriptions for this patient are visible even if medicalRecords entry was not created
    const seenPrescriptionIds = new Set(hydratedRecords.map((r) => r.prescriptionId).filter(Boolean));
    const seenConsultationIds = new Set(hydratedRecords.map((r) => r.consultationId).filter(Boolean));

    const patientPrescriptions = await db
      .select({
        rx: prescriptions,
        doctorName: users.name,
      })
      .from(prescriptions)
      .leftJoin(users, eq(prescriptions.doctorId, users.id))
      .where(eq(prescriptions.patientId, patientId))
      .orderBy(desc(prescriptions.createdAt));

    for (const { rx, doctorName } of patientPrescriptions) {
      if (!seenPrescriptionIds.has(rx.id) && !seenConsultationIds.has(rx.consultationId)) {
        const items = await db
          .select()
          .from(prescriptionItems)
          .where(eq(prescriptionItems.prescriptionId, rx.id));

        hydratedRecords.push({
          id: rx.id,
          patientId: rx.patientId,
          consultationId: rx.consultationId,
          prescriptionId: rx.id,
          source: "consultation",
          recordTitle: `Prescription — ${rx.diagnosis || "Consultation"}`,
          recordType: "other",
          description: rx.diagnosis || "Digital Prescription",
          uploadedBy: "doctor",
          recordDate: rx.createdAt,
          doctorName: doctorName || "Doctor",
          hospitalName: "E-Sanjeevani Healthcare",
          diagnosis: rx.diagnosis || "",
          advice: rx.advice || "",
          recommendedTests: rx.recommendedTests || "",
          referralInfo: rx.referralInfo || "",
          followUpInstructions: rx.followUpInstructions || "",
          followUpRequired: rx.followUpRequired || false,
          followUpDays: rx.followUpDays || null,
          doctorNotes: rx.doctorNotes || "",
          status: rx.status || "finalized",
          amendedFromId: rx.amendedFromId || null,
          prescriptionPdfUrl: rx.pdfUrl || "",
          prescriptionItems: items,
          prescription: items.map((i) => `${i.medicineName} ${i.dosage}`).join(", "),
          attachments: rx.pdfUrl
            ? [{ id: rx.id, fileName: `Prescription_${rx.id.slice(0, 8)}.pdf`, fileUrl: rx.pdfUrl }]
            : [],
          createdAt: rx.createdAt,
          updatedAt: rx.updatedAt,
        });
      }
    }

    return hydratedRecords.sort(
      (a, b) => new Date(b.recordDate || b.createdAt) - new Date(a.recordDate || a.createdAt)
    );
  }

  static async findByDoctorId(doctorId) {
    const rows = await db
      .select({ record: medicalRecords, patientName: users.name })
      .from(medicalRecords)
      .innerJoin(consultations, eq(medicalRecords.consultationId, consultations.id))
      .leftJoin(users, eq(medicalRecords.patientId, users.id))
      .where(eq(consultations.doctorId, doctorId))
      .orderBy(desc(medicalRecords.recordDate));

    const hydratedRecords = await Promise.all(
      rows.map(async ({ record, patientName }) => ({
        ...(await this._hydrate(record)),
        patientName: patientName || "Patient",
      }))
    );

    const seenPrescriptionIds = new Set(hydratedRecords.map((r) => r.prescriptionId).filter(Boolean));
    const seenConsultationIds = new Set(hydratedRecords.map((r) => r.consultationId).filter(Boolean));

    const doctorPrescriptions = await db
      .select({
        rx: prescriptions,
        patientName: users.name,
      })
      .from(prescriptions)
      .leftJoin(users, eq(prescriptions.patientId, users.id))
      .where(eq(prescriptions.doctorId, doctorId))
      .orderBy(desc(prescriptions.createdAt));

    for (const { rx, patientName } of doctorPrescriptions) {
      if (!seenPrescriptionIds.has(rx.id) && !seenConsultationIds.has(rx.consultationId)) {
        const items = await db
          .select()
          .from(prescriptionItems)
          .where(eq(prescriptionItems.prescriptionId, rx.id));

        hydratedRecords.push({
          id: rx.id,
          patientId: rx.patientId,
          patientName: patientName || "Patient",
          consultationId: rx.consultationId,
          prescriptionId: rx.id,
          source: "consultation",
          recordTitle: `Prescription — ${rx.diagnosis || "Consultation"}`,
          recordType: "other",
          description: rx.diagnosis || "Digital Prescription",
          uploadedBy: "doctor",
          recordDate: rx.createdAt,
          doctorName: "Doctor",
          hospitalName: "E-Sanjeevani Healthcare",
          diagnosis: rx.diagnosis || "",
          advice: rx.advice || "",
          recommendedTests: rx.recommendedTests || "",
          referralInfo: rx.referralInfo || "",
          followUpInstructions: rx.followUpInstructions || "",
          followUpRequired: rx.followUpRequired || false,
          followUpDays: rx.followUpDays || null,
          doctorNotes: rx.doctorNotes || "",
          status: rx.status || "finalized",
          amendedFromId: rx.amendedFromId || null,
          prescriptionPdfUrl: rx.pdfUrl || "",
          prescriptionItems: items,
          prescription: items.map((i) => `${i.medicineName} ${i.dosage}`).join(", "),
          attachments: rx.pdfUrl
            ? [{ id: rx.id, fileName: `Prescription_${rx.id.slice(0, 8)}.pdf`, fileUrl: rx.pdfUrl }]
            : [],
          createdAt: rx.createdAt,
          updatedAt: rx.updatedAt,
        });
      }
    }

    return hydratedRecords.sort(
      (a, b) => new Date(b.recordDate || b.createdAt) - new Date(a.recordDate || a.createdAt)
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

    let prescription = null;
    let items = [];

    if (record.prescriptionId) {
      const [rx] = await db
        .select()
        .from(prescriptions)
        .where(eq(prescriptions.id, record.prescriptionId))
        .limit(1);
      prescription = rx;
    } else if (record.consultationId) {
      const [rx] = await db
        .select()
        .from(prescriptions)
        .where(eq(prescriptions.consultationId, record.consultationId))
        .orderBy(desc(prescriptions.createdAt))
        .limit(1);
      prescription = rx;
    }

    if (prescription) {
      items = await db
        .select()
        .from(prescriptionItems)
        .where(eq(prescriptionItems.prescriptionId, prescription.id));
    }

    let doctorName = record.doctorName;
    if ((!doctorName || doctorName === "Doctor") && (record.consultationId || prescription?.doctorId)) {
      const docId = prescription?.doctorId;
      if (docId) {
        const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, docId)).limit(1);
        if (u?.name) doctorName = u.name;
      }
    }

    const pdfFromAtt = attachments.find(
      (a) => a.fileName?.toLowerCase().includes("prescription") || a.fileName?.toLowerCase().endsWith(".pdf")
    )?.fileUrl;

    return {
      ...record,
      doctorName: doctorName || record.doctorName || "",
      diagnosis: prescription?.diagnosis || record.description || "",
      advice: prescription?.advice || "",
      recommendedTests: prescription?.recommendedTests || "",
      referralInfo: prescription?.referralInfo || "",
      followUpInstructions: prescription?.followUpInstructions || "",
      followUpRequired: prescription?.followUpRequired || false,
      followUpDays: prescription?.followUpDays || null,
      doctorNotes: prescription?.doctorNotes || "",
      status: prescription?.status || "finalized",
      amendedFromId: prescription?.amendedFromId || null,
      prescriptionPdfUrl: prescription?.pdfUrl || pdfFromAtt || "",
      prescriptionItems: items,
      prescription: items.length > 0 ? items.map((i) => `${i.medicineName} ${i.dosage}`).join(", ") : "",
      attachments,
    };
  }
}
