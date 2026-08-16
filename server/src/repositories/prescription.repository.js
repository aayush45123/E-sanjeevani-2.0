import { and, desc, eq } from "drizzle-orm";
import { db } from "../config/neonDb.js";
import {
  prescriptions,
  prescriptionItems,
  users,
  consultations,
} from "../database/schema/index.js";

/**
 * Parses a duration string like "5 days", "2 weeks", "1 month" and returns
 * the number of milliseconds to add to a start date.
 */
function parseDurationMs(durationStr = "") {
  const str = durationStr.toLowerCase().trim();
  const num = parseInt(str.match(/\d+/)?.[0] || "7", 10);
  if (str.includes("week")) return num * 7 * 86400_000;
  if (str.includes("month")) return num * 30 * 86400_000;
  return num * 86400_000; // default: days
}

export class PrescriptionRepository {
  // ─── CREATE (draft) ──────────────────────────────────────────────────────────

  static async create({
    consultationId,
    patientId,
    doctorId,
    diagnosis,
    advice,
    recommendedTests,
    referralInfo,
    followUpInstructions,
    followUpRequired,
    followUpDays,
    doctorNotes,
    items = [],
  }) {
    const [rx] = await db
      .insert(prescriptions)
      .values({
        consultationId,
        patientId,
        doctorId,
        diagnosis: diagnosis || "",
        advice: advice || "",
        recommendedTests: recommendedTests || "",
        referralInfo: referralInfo || "",
        followUpInstructions: followUpInstructions || "",
        followUpRequired: Boolean(followUpRequired),
        followUpDays: followUpDays ? parseInt(followUpDays, 10) : null,
        doctorNotes: doctorNotes || "",
        status: "draft",
        updatedAt: new Date(),
      })
      .returning();

    // Insert prescription items with computed startDate / endDate
    const savedItems = await this._saveItems(rx.id, items);

    return { ...rx, items: savedItems };
  }

  // ─── FINALIZE (immutable) ────────────────────────────────────────────────────

  static async finalize(prescriptionId, pdfUrl = "") {
    const [updated] = await db
      .update(prescriptions)
      .set({
        status: "finalized",
        pdfUrl,
        updatedAt: new Date(),
      })
      .where(eq(prescriptions.id, prescriptionId))
      .returning();
    return updated;
  }

  // ─── AMEND (correction) ───────────────────────────────────────────────────────

  static async amend(originalPrescriptionId, amendData) {
    // Mark the original as "amended"
    await db
      .update(prescriptions)
      .set({ status: "amended", updatedAt: new Date() })
      .where(eq(prescriptions.id, originalPrescriptionId));

    // Fetch original to carry over unchanged fields
    const original = await this.findById(originalPrescriptionId);
    if (!original) throw { status: 404, message: "Original prescription not found" };

    const [newRx] = await db
      .insert(prescriptions)
      .values({
        consultationId: original.consultationId,
        patientId: original.patientId,
        doctorId: original.doctorId,
        diagnosis: amendData.diagnosis ?? original.diagnosis,
        advice: amendData.advice ?? original.advice,
        recommendedTests: amendData.recommendedTests ?? original.recommendedTests,
        referralInfo: amendData.referralInfo ?? original.referralInfo,
        followUpInstructions: amendData.followUpInstructions ?? original.followUpInstructions,
        followUpRequired: amendData.followUpRequired ?? original.followUpRequired,
        followUpDays: amendData.followUpDays ?? original.followUpDays,
        doctorNotes: amendData.doctorNotes ?? original.doctorNotes,
        status: "draft",
        amendedFromId: originalPrescriptionId,
        updatedAt: new Date(),
      })
      .returning();

    const savedItems = await this._saveItems(newRx.id, amendData.items || original.items || []);

    return { ...newRx, items: savedItems };
  }

  // ─── DISCONTINUE ITEM ────────────────────────────────────────────────────────

  static async discontinueItem(itemId) {
    const [updated] = await db
      .update(prescriptionItems)
      .set({ status: "discontinued" })
      .where(eq(prescriptionItems.id, itemId))
      .returning();
    return updated;
  }

  // ─── QUERIES ─────────────────────────────────────────────────────────────────

  static async findById(id) {
    const [rx] = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.id, id))
      .limit(1);

    if (!rx) return null;
    const items = await this._getItemsWithStatus(rx.id);
    return { ...rx, items };
  }

  static async findByConsultationId(consultationId) {
    const rows = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.consultationId, consultationId))
      .orderBy(desc(prescriptions.createdAt));

    return Promise.all(
      rows.map(async (rx) => ({ ...rx, items: await this._getItemsWithStatus(rx.id) }))
    );
  }

  static async findByPatientId(patientId) {
    const rows = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.patientId, patientId))
      .orderBy(desc(prescriptions.createdAt));

    return Promise.all(
      rows.map(async (rx) => ({ ...rx, items: await this._getItemsWithStatus(rx.id) }))
    );
  }

  static async findByDoctorAndPatient(doctorId, patientId) {
    const rows = await db
      .select()
      .from(prescriptions)
      .where(
        and(
          eq(prescriptions.doctorId, doctorId),
          eq(prescriptions.patientId, patientId)
        )
      )
      .orderBy(desc(prescriptions.createdAt));

    return Promise.all(
      rows.map(async (rx) => ({ ...rx, items: await this._getItemsWithStatus(rx.id) }))
    );
  }

  /** Verify that a doctor has at least one consultation with a patient */
  static async verifyDoctorPatientRelationship(doctorId, patientId) {
    const [row] = await db
      .select({ id: consultations.id })
      .from(consultations)
      .where(
        and(
          eq(consultations.doctorId, doctorId),
          eq(consultations.patientId, patientId)
        )
      )
      .limit(1);
    return !!row;
  }

  // ─── PRIVATE HELPERS ─────────────────────────────────────────────────────────

  static async _saveItems(prescriptionId, items = []) {
    if (!items.length) return [];

    const now = new Date();
    const valuesToInsert = items
      .filter((i) => i.medicineName?.trim())
      .map((item) => {
        const startDate = now;
        const endDate = new Date(now.getTime() + parseDurationMs(item.duration));
        return {
          prescriptionId,
          medicineName: item.medicineName.trim(),
          dosage: item.dosage || "",
          route: item.route || "Oral",
          frequency: item.frequency || "",
          duration: item.duration || "",
          instructions: item.instructions || "",
          startDate,
          endDate,
          status: "active",
        };
      });

    if (!valuesToInsert.length) return [];
    return db.insert(prescriptionItems).values(valuesToInsert).returning();
  }

  /**
   * Returns items with a real-time computed `currentStatus`:
   *   active       → today <= endDate AND db status = active
   *   completed    → today > endDate  OR  db status = completed
   *   discontinued → db status = discontinued
   */
  static async _getItemsWithStatus(prescriptionId) {
    const items = await db
      .select()
      .from(prescriptionItems)
      .where(eq(prescriptionItems.prescriptionId, prescriptionId));

    const now = new Date();
    return items.map((item) => {
      let currentStatus = item.status;
      if (item.status === "active" && item.endDate && new Date(item.endDate) < now) {
        currentStatus = "completed";
      }
      return { ...item, currentStatus };
    });
  }
}
