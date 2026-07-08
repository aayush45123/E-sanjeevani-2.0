import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  index,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

import { urgencyLevelEnum, triageStatusEnum } from "./enums.js";

export const triageSessions = pgTable(
  "triage_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    symptoms: jsonb("symptoms").default([]).notNull(),

    medicalHistory: text("medical_history").default(""),

    currentMedications: text("current_medications").default(""),

    allergies: text("allergies").default(""),

    additionalNotes: text("additional_notes").default(""),

    urgencyScore: integer("urgency_score").default(0).notNull(),

    urgencyLevel: urgencyLevelEnum("urgency_level").default("low").notNull(),

    status: triageStatusEnum("status").default("pending").notNull(),

    assignedDoctorId: uuid("assigned_doctor_id").references(() => users.id, {
      onDelete: "set null",
    }),

    recommendedSpecialty: varchar("recommended_specialty", {
      length: 255,
    }),

    summaryTitle: varchar("summary_title", {
      length: 500,
    }),

    summaryDescription: text("summary_description"),

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
    index("triage_sessions_patient_created_idx").on(
      table.patientId,
      table.createdAt,
    ),

    index("triage_sessions_status_idx").on(table.status),

    index("triage_sessions_assigned_doctor_idx").on(table.assignedDoctorId),
  ],
);
