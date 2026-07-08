import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const aiTriageChats = pgTable(
  "ai_triage_chats",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    symptoms: text("symptoms").notNull(),

    predictedDisease: varchar("predicted_disease", {
      length: 500,
    }).notNull(),

    urgency: varchar("urgency", {
      length: 100,
    }).notNull(),

    doctorType: varchar("doctor_type", {
      length: 255,
    }).notNull(),

    finalDoctorDiagnosis: text("final_doctor_diagnosis").default(""),

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
    index("ai_triage_chats_user_created_idx").on(table.userId, table.createdAt),
  ],
);
