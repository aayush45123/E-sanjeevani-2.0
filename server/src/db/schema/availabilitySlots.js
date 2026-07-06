import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";
import { consultations } from "./consultations.js";
import { doctorAvailabilities } from "./doctorAvailabilities.js";

export const availabilitySlots = pgTable(
  "availability_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    availabilityId: uuid("availability_id")
      .notNull()
      .references(() => doctorAvailabilities.id, {
        onDelete: "cascade",
      }),

    startTime: varchar("start_time", {
      length: 10,
    }).notNull(),

    endTime: varchar("end_time", {
      length: 10,
    }).notNull(),

    isBooked: boolean("is_booked").default(false).notNull(),

    bookedById: uuid("booked_by_id").references(() => users.id, {
      onDelete: "set null",
    }),

    consultationId: uuid("consultation_id").references(() => consultations.id, {
      onDelete: "set null",
    }),

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
    uniqueIndex("availability_slot_time_unique").on(
      table.availabilityId,
      table.startTime,
      table.endTime,
    ),

    index("availability_slots_availability_idx").on(table.availabilityId),

    index("availability_slots_consultation_idx").on(table.consultationId),
  ],
);
