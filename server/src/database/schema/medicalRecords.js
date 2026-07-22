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

export const medicalRecords = pgTable(
  "medical_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    consultationId: uuid("consultation_id").references(() => consultations.id, {
      onDelete: "cascade",
    }),

    source: varchar("source", {
      length: 50,
    })
      .default("consultation")
      .notNull(), // 'consultation' or 'patient_upload'

    recordTitle: varchar("record_title", {
      length: 255,
    }).default(""),

    recordDate: timestamp("record_date", {
      withTimezone: true,
    }).defaultNow(),

    doctorName: varchar("doctor_name", {
      length: 255,
    }).default(""),

    hospitalName: varchar("hospital_name", {
      length: 255,
    }).default(""),

    diagnosis: text("diagnosis").default(""),

    prescription: text("prescription").default(""),

    doctorNotes: text("doctor_notes").default(""),

    advice: text("advice").default(""),

    recommendedTests: text("recommended_tests").default(""),

    followUpRequired: boolean("follow_up_required").default(false).notNull(),

    followUpDays: integer("follow_up_days"),

    prescriptionPdfUrl: varchar("prescription_pdf_url", {
      length: 2048,
    }).default(""),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("medical_records_patient_idx").on(table.patientId),
    index("medical_records_consultation_idx").on(table.consultationId),
    index("medical_records_source_idx").on(table.source),
  ]
);
