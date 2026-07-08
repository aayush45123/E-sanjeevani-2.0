import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

import {
  consultationModeEnum,
  consultationStatusEnum,
  paymentStatusEnum,
} from "./enums.js";

export const consultations = pgTable(
  "consultations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    consultationType: consultationModeEnum("consultation_type").notNull(),

    symptoms: text("symptoms").notNull(),

    currentProblem: text("current_problem").notNull(),

    currentMedication: text("current_medication").default(""),

    medicalHistory: text("medical_history").default(""),

    allergies: text("allergies").default(""),

    consultationDate: timestamp("consultation_date", {
      withTimezone: true,
    }).notNull(),

    startTime: varchar("start_time", {
      length: 10,
    }).notNull(),

    endTime: varchar("end_time", {
      length: 10,
    }).notNull(),

    status: consultationStatusEnum("status").default("scheduled").notNull(),

    roomId: varchar("room_id", {
      length: 255,
    }).default(""),

    doctorNotes: text("doctor_notes").default(""),

    prescription: text("prescription").default(""),

    followUpRequired: boolean("follow_up_required").default(false).notNull(),

    paymentStatus: paymentStatusEnum("payment_status")
      .default("pending")
      .notNull(),

    reminderSent: boolean("reminder_sent").default(false).notNull(),

    reminderSentAt: timestamp("reminder_sent_at", {
      withTimezone: true,
    }),

    patientJoined: boolean("patient_joined").default(false).notNull(),

    doctorJoined: boolean("doctor_joined").default(false).notNull(),

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
    index("consultations_doctor_date_idx").on(
      table.doctorId,
      table.consultationDate,
    ),

    index("consultations_patient_date_idx").on(
      table.patientId,
      table.consultationDate,
    ),

    index("consultations_status_idx").on(table.status),
  ],
);
