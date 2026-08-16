import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";
import { consultations } from "./consultations.js";
import { prescriptionStatusEnum } from "./enums.js";

/**
 * PRESCRIPTIONS TABLE
 *
 * First-class clinical entity created during or after a consultation.
 * - Lifecycle:  draft  →  finalized  →  (amended if correction needed)
 * - Once finalized the row must NOT be mutated. Corrections create a NEW
 *   prescription with status="amended" and an `amendedFromId` reference.
 * - PDF URL is stored as a reference (not binary).
 * - Prescription items are stored in the prescription_items table (FK: prescriptionId).
 */
export const prescriptions = pgTable(
  "prescriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    /** The consultation during which this prescription was issued */
    consultationId: uuid("consultation_id")
      .notNull()
      .references(() => consultations.id, { onDelete: "cascade" }),

    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // ── CLINICAL FIELDS ─────────────────────────────────────────────────────
    diagnosis: text("diagnosis").default("").notNull(),

    advice: text("advice").default(""),

    recommendedTests: text("recommended_tests").default(""),

    referralInfo: text("referral_info").default(""),

    /** Follow-up instructions / general notes visible to the patient */
    followUpInstructions: text("follow_up_instructions").default(""),

    followUpRequired: boolean("follow_up_required").default(false).notNull(),

    followUpDays: integer("follow_up_days"),

    /** Internal notes — visible only to the doctor, NOT shown to patient */
    doctorNotes: text("doctor_notes").default(""),

    // ── LIFECYCLE ────────────────────────────────────────────────────────────
    /**
     * draft      — being written, editable
     * finalized  — submitted, immutable historical record
     * amended    — correction; links back to original via amendedFromId
     */
    status: prescriptionStatusEnum("status").default("draft").notNull(),

    /** If this is an amendment, reference the original prescription id */
    amendedFromId: uuid("amended_from_id"),

    // ── PDF ──────────────────────────────────────────────────────────────────
    /** URL / cloud reference to generated PDF; NOT stored as binary */
    pdfUrl: varchar("pdf_url", { length: 2048 }).default(""),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("prescriptions_patient_idx").on(table.patientId),
    index("prescriptions_doctor_idx").on(table.doctorId),
    index("prescriptions_consultation_idx").on(table.consultationId),
    index("prescriptions_status_idx").on(table.status),
  ]
);
