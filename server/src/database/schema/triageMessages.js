import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";
import { triageSessions } from "./triageSessions.js";

export const triageMessages = pgTable(
  "triage_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    triageSessionId: uuid("triage_session_id")
      .notNull()
      .references(() => triageSessions.id, {
        onDelete: "cascade",
      }),

    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    role: text("role").notNull(),

    content: text("content").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("triage_messages_session_created_idx").on(
      table.triageSessionId,
      table.createdAt,
    ),
    index("triage_messages_patient_idx").on(table.patientId),
  ],
);
