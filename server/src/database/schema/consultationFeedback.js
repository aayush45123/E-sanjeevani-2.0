import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";
import { consultations } from "./consultations.js";

export const consultationFeedback = pgTable(
  "consultation_feedback",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    consultationId: uuid("consultation_id")
      .notNull()
      .references(() => consultations.id, { onDelete: "cascade" }),

    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Overall rating 1-5
    rating: integer("rating").notNull(),

    // Optional text feedback
    comment: text("comment").default(""),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("feedback_consultation_idx").on(table.consultationId),
    index("feedback_doctor_idx").on(table.doctorId),
    index("feedback_patient_idx").on(table.patientId),
  ],
);
