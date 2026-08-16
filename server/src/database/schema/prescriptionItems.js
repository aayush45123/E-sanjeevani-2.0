import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { prescriptions } from "./prescriptions.js";
import { prescriptionItemStatusEnum } from "./enums.js";

/**
 * PRESCRIPTION_ITEMS TABLE
 *
 * Each row is one medicine line within a Prescription.
 *
 * Active medication logic:
 *   - startDate = prescription.createdAt (set at creation)
 *   - endDate   = startDate + parsed duration days (computed at insertion)
 *   - status    = "active" | "completed" | "discontinued"
 *
 *   Active  → today <= endDate AND status = "active"
 *   Done    → today > endDate  OR  status IN ("completed", "discontinued")
 *
 * Doctors may manually set status = "discontinued" at any time.
 */
export const prescriptionItems = pgTable(
  "prescription_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    prescriptionId: uuid("prescription_id")
      .notNull()
      .references(() => prescriptions.id, { onDelete: "cascade" }),

    medicineName: varchar("medicine_name", { length: 255 }).notNull(),

    dosage: varchar("dosage", { length: 100 }).notNull(),

    /** Route of administration: Oral, IV, Topical, etc. */
    route: varchar("route", { length: 100 }).default("Oral"),

    frequency: varchar("frequency", { length: 100 }).notNull(),

    duration: varchar("duration", { length: 100 }).notNull(),

    instructions: varchar("instructions", { length: 255 }).default(""),

    /** When the patient should start taking this medicine */
    startDate: timestamp("start_date", { withTimezone: true }).defaultNow(),

    /**
     * Computed at insertion: startDate + parsed duration days.
     * Allows deterministic active/completed status without cron jobs.
     */
    endDate: timestamp("end_date", { withTimezone: true }),

    /** active | completed | discontinued */
    status: prescriptionItemStatusEnum("status").default("active").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("prescription_items_prescription_idx").on(table.prescriptionId),
    index("prescription_items_status_idx").on(table.status),
  ]
);
