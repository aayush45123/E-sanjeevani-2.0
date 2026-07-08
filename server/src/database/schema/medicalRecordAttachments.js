import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";

import { medicalRecords } from "./medicalRecords.js";

export const medicalRecordAttachments = pgTable(
  "medical_record_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    medicalRecordId: uuid("medical_record_id")
      .notNull()
      .references(() => medicalRecords.id, {
        onDelete: "cascade",
      }),

    fileName: varchar("file_name", {
      length: 500,
    }),

    fileUrl: varchar("file_url", {
      length: 2048,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("medical_record_attachments_record_idx").on(table.medicalRecordId),
  ],
);
