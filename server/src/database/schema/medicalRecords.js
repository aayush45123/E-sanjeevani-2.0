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
import { prescriptions } from "./prescriptions.js";
import { medicalRecordTypeEnum } from "./enums.js";

/**
 * MEDICAL_RECORDS TABLE
 *
 * Stores SUPPORTING clinical documents uploaded by patients or doctors:
 *   - Lab reports
 *   - Blood test results
 *   - Scan / X-ray reports
 *   - Discharge summaries
 *   - Medical certificates
 *   - Previous consultation notes (uploaded externally)
 *   - Other
 *
 * NOT used for prescriptions — prescriptions have their own table.
 * A record can optionally link back to the consultation or prescription
 * that generated it (nullable FKs).
 *
 * source:
 *   "consultation"    — created automatically when a consultation ends
 *   "patient_upload"  — patient uploads historical documents manually
 *   "doctor_upload"   — doctor attaches supporting documentation
 */
export const medicalRecords = pgTable(
  "medical_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /** Optional link to the consultation this record relates to */
    consultationId: uuid("consultation_id").references(() => consultations.id, {
      onDelete: "set null",
    }),

    /**
     * Optional link to the prescription this supporting document
     * (e.g. a lab result ordered in the prescription) relates to.
     */
    prescriptionId: uuid("prescription_id").references(() => prescriptions.id, {
      onDelete: "set null",
    }),

    /** "consultation" | "patient_upload" | "doctor_upload" */
    source: varchar("source", { length: 50 }).default("patient_upload").notNull(),

    recordTitle: varchar("record_title", { length: 255 }).default(""),

    /**
     * Type of supporting document.
     * "prescription" is intentionally excluded — use the prescriptions table.
     */
    recordType: medicalRecordTypeEnum("record_type").default("other").notNull(),

    description: text("description").default(""),

    uploadedBy: varchar("uploaded_by", { length: 50 }).default("patient").notNull(),

    recordDate: timestamp("record_date", { withTimezone: true }).defaultNow(),

    /** Doctor / facility that produced the document */
    doctorName: varchar("doctor_name", { length: 255 }).default(""),
    hospitalName: varchar("hospital_name", { length: 255 }).default(""),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("medical_records_patient_idx").on(table.patientId),
    index("medical_records_consultation_idx").on(table.consultationId),
    index("medical_records_prescription_idx").on(table.prescriptionId),
    index("medical_records_source_idx").on(table.source),
  ]
);
