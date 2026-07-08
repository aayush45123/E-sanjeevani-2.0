import {
  pgTable,
  uuid,
  integer,
  real,
  varchar,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

import {
  patientGenderEnum,
  bloodGroupEnum,
  maritalStatusEnum,
  yesNoEnum,
  dietEnum,
  exerciseEnum,
} from "./enums.js";

export const patientProfiles = pgTable(
  "patient_profiles",

  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    age: integer("age").notNull(),

    gender: patientGenderEnum("gender").notNull(),

    bloodGroup: bloodGroupEnum("blood_group").notNull(),

    maritalStatus: maritalStatusEnum("marital_status").notNull(),

    height: real("height").notNull(),

    weight: real("weight").notNull(),

    bloodPressure: varchar("blood_pressure", {
      length: 50,
    }).default(""),

    smoking: yesNoEnum("smoking").notNull(),

    alcohol: yesNoEnum("alcohol").notNull(),

    diet: dietEnum("diet").notNull(),

    exercise: exerciseEnum("exercise").notNull(),

    allergies: text("allergies").default(""),

    chronicConditions: text("chronic_conditions").default(""),

    currentMedications: text("current_medications").default(""),

    pastSurgeries: text("past_surgeries").default(""),

    isProfileComplete: boolean("is_profile_complete").default(false).notNull(),

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

  (table) => [uniqueIndex("patient_profiles_user_id_unique").on(table.userId)],
);
