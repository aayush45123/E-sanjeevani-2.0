import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";

import { consultations } from "./consultations.js";

export const consultationReports = pgTable(
  "consultation_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    consultationId: uuid("consultation_id")
      .notNull()
      .references(() => consultations.id, {
        onDelete: "cascade",
      }),

    fileName: varchar("file_name", {
      length: 500,
    }),

    fileUrl: varchar("file_url", {
      length: 2048,
    }),

    uploadedAt: timestamp("uploaded_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("consultation_reports_consultation_idx").on(table.consultationId),
  ],
);
