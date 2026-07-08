import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
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
        onDelete: "restrict",
      }),

    consultationId: uuid("consultation_id")
      .notNull()
      .references(() => consultations.id, {
        onDelete: "restrict",
      }),

    diagnosis: text("diagnosis").default(""),

    prescription: text("prescription").default(""),

    doctorNotes: text("doctor_notes").default(""),

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

    uniqueIndex("medical_records_consultation_unique").on(table.consultationId),
  ],
);
