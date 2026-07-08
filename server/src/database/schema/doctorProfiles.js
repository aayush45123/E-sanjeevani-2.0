import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  doublePrecision,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

import {
  genderEnum,
  verificationStatusEnum,
  consultationModeEnum,
} from "./enums.js";

export const doctorProfiles = pgTable(
  "doctor_profiles",

  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    phone: varchar("phone", {
      length: 30,
    }).notNull(),

    gender: genderEnum("gender").notNull(),

    dateOfBirth: timestamp("date_of_birth", {
      withTimezone: true,
    }).notNull(),

    profilePhoto: varchar("profile_photo", {
      length: 2048,
    }).default(""),

    specialization: varchar("specialization", {
      length: 255,
    }).notNull(),

    superSpecialization: varchar("super_specialization", {
      length: 255,
    }).default(""),

    qualification: varchar("qualification", {
      length: 500,
    }).notNull(),

    medicalRegistrationNumber: varchar("medical_registration_number", {
      length: 255,
    }).notNull(),

    experience: integer("experience").notNull(),

    hospitalName: varchar("hospital_name", {
      length: 500,
    }).notNull(),

    consultationFee: numeric("consultation_fee", {
      precision: 10,
      scale: 2,
    }).notNull(),

    languagesSpoken: text("languages_spoken").array().default([]),

    workingDays: text("working_days").array().default([]),

    /*
      We intentionally use TEXT[] here instead of consultationModeEnum.array().

      This makes controller migration and future addition of consultation
      modes easier. Individual consultation records will still use the
      strict PostgreSQL enum.
    */
    consultationModes: text("consultation_modes").array().default([]),

    startTime: varchar("start_time", {
      length: 10,
    }).notNull(),

    endTime: varchar("end_time", {
      length: 10,
    }).notNull(),

    medicalLicense: varchar("medical_license", {
      length: 2048,
    }).default(""),

    degreeCertificate: varchar("degree_certificate", {
      length: 2048,
    }).default(""),

    governmentIdProof: varchar("government_id_proof", {
      length: 2048,
    }).default(""),

    aboutDoctor: text("about_doctor").default(""),

    shortBio: text("short_bio").default(""),

    hasClinic: boolean("has_clinic").default(false).notNull(),

    clinicApartment: varchar("clinic_apartment", {
      length: 255,
    }),

    clinicStreet: varchar("clinic_street", {
      length: 500,
    }),

    clinicDistrict: varchar("clinic_district", {
      length: 255,
    }),

    clinicCity: varchar("clinic_city", {
      length: 255,
    }),

    clinicPinCode: varchar("clinic_pin_code", {
      length: 20,
    }),

    clinicState: varchar("clinic_state", {
      length: 255,
    }),

    clinicLongitude: doublePrecision("clinic_longitude"),

    clinicLatitude: doublePrecision("clinic_latitude"),

    profileCompleted: boolean("profile_completed").default(false).notNull(),

    verificationStatus: verificationStatusEnum("verification_status")
      .default("pending")
      .notNull(),

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
    uniqueIndex("doctor_profiles_user_id_unique").on(table.userId),

    uniqueIndex("doctor_profiles_registration_unique").on(
      table.medicalRegistrationNumber,
    ),

    index("doctor_profiles_specialization_idx").on(table.specialization),

    index("doctor_profiles_city_idx").on(table.clinicCity),

    index("doctor_profiles_verification_status_idx").on(
      table.verificationStatus,
    ),
  ],
);
