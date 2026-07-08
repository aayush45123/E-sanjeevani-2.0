import {
  pgTable,
  uuid,
  date,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const doctorAvailabilities = pgTable(
  "doctor_availabilities",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    availableDate: date("available_date", {
      mode: "string",
    }).notNull(),

    isActive: boolean("is_active").default(true).notNull(),

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
    uniqueIndex("doctor_available_date_unique").on(
      table.doctorId,
      table.availableDate,
    ),

    index("doctor_availabilities_doctor_date_idx").on(
      table.doctorId,
      table.availableDate,
    ),
  ],
);
