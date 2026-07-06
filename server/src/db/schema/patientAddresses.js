import {
  pgTable,
  uuid,
  varchar,
  doublePrecision,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const patientAddresses = pgTable(
  "patient_addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    apartment: varchar("apartment", {
      length: 255,
    }),

    street: varchar("street", {
      length: 500,
    }),

    district: varchar("district", {
      length: 255,
    }),

    city: varchar("city", {
      length: 255,
    }),

    pinCode: varchar("pin_code", {
      length: 20,
    }),

    state: varchar("state", {
      length: 255,
    }),

    longitude: doublePrecision("longitude"),

    latitude: doublePrecision("latitude"),

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
    uniqueIndex("patient_addresses_user_unique").on(table.userId),

    index("patient_addresses_city_idx").on(table.city),
  ],
);
