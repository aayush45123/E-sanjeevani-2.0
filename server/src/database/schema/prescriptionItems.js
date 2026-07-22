import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { medicalRecords } from "./medicalRecords.js";

export const prescriptionItems = pgTable(
  "prescription_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    medicalRecordId: uuid("medical_record_id")
      .notNull()
      .references(() => medicalRecords.id, {
        onDelete: "cascade",
      }),

    medicineName: varchar("medicine_name", {
      length: 255,
    }).notNull(),

    dosage: varchar("dosage", {
      length: 100,
    }).notNull(),

    frequency: varchar("frequency", {
      length: 100,
    }).notNull(),

    duration: varchar("duration", {
      length: 100,
    }).notNull(),

    instructions: varchar("instructions", {
      length: 255,
    }).default(""),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("prescription_items_record_idx").on(table.medicalRecordId),
  ]
);
