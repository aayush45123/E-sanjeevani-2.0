import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  real,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";
import { consultations } from "./consultations.js";

/**
 * PATIENT_HEALTH_METRICS TABLE
 *
 * Stores longitudinal, timestamped physiological vitals and laboratory metrics
 * recorded during consultations, extracted from uploaded lab reports, or logged by clinicians.
 * Enables time-series trajectory tracking, comparative Delta analysis, and trend alerts.
 */
export const patientHealthMetrics = pgTable(
  "patient_health_metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /** Optional link to consultation during which vitals were recorded */
    consultationId: uuid("consultation_id").references(() => consultations.id, {
      onDelete: "set null",
    }),

    /** Clinician or user who recorded this measurement */
    recordedBy: uuid("recorded_by").references(() => users.id, {
      onDelete: "set null",
    }),

    /** Timestamp of the actual physiological measurement */
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    // ── VITAL SIGNS ──────────────────────────────────────────────────────────
    /** Systolic Blood Pressure (mmHg) */
    systolicBp: integer("systolic_bp"),

    /** Diastolic Blood Pressure (mmHg) */
    diastolicBp: integer("diastolic_bp"),

    /** Heart Rate (beats per minute) */
    heartRate: integer("heart_rate"),

    /** Body Temperature in Fahrenheit */
    temperature: real("temperature"),

    /** Temperature scale: 'F' or 'C' */
    temperatureUnit: varchar("temperature_unit", { length: 10 }).default("F").notNull(),

    /** Oxygen Saturation (SpO2 %) */
    spo2: integer("spo2"),

    /** Respiratory Rate (breaths / minute) */
    respiratoryRate: integer("respiratory_rate"),

    // ── METABOLIC & ANTHROPOMETRIC ───────────────────────────────────────────
    /** Blood Glucose (mg/dL) */
    bloodGlucose: real("blood_glucose"),

    /** 'fasting' | 'postprandial' | 'random' */
    glucoseType: varchar("glucose_type", { length: 30 }).default("random"),

    /** Patient Weight (kg) */
    weight: real("weight"),

    /** Patient Height (cm) */
    height: real("height"),

    /** Body Mass Index */
    bmi: real("bmi"),

    // ── LAB BIOMARKERS (Extracted or Entered) ─────────────────────────────────
    /** Platelet Count (per mcL / mm^3) e.g. 150000-450000 */
    plateletCount: integer("platelet_count"),

    /** White Blood Cell Count (cells/mcL) */
    wbcCount: integer("wbc_count"),

    /** Hemoglobin (g/dL) */
    hemoglobin: real("hemoglobin"),

    /** C-Reactive Protein (mg/L) */
    crp: real("crp"),

    /** Modified Early Warning Score (MEWS calculated severity 0-14) */
    mewsScore: integer("mews_score").default(0),

    /** Clinical notes or context regarding the reading */
    notes: text("notes").default(""),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("health_metrics_patient_idx").on(table.patientId),
    index("health_metrics_consultation_idx").on(table.consultationId),
    index("health_metrics_recorded_at_idx").on(table.recordedAt),
  ]
);

/**
 * PATIENT_HEALTH_SUMMARIES TABLE
 *
 * Persists AI-generated longitudinal health intelligence summaries,
 * symptom recurrence trajectories, worsening health alerts, and RAG context.
 */
export const patientHealthSummaries = pgTable(
  "patient_health_summaries",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /** High-level executive synthesis for the clinician */
    clinicalSynopsis: text("clinical_synopsis").notNull(),

    /** Structured JSON string of detected recurring symptoms & progression */
    recurrentSymptoms: text("recurrent_symptoms").default("[]"),

    /** Structured JSON string of deteriorating/improving health parameters */
    worseningTrends: text("worsening_trends").default("[]"),

    /** Structured JSON string of comparative metric deltas vs baseline */
    comparativeMetrics: text("comparative_metrics").default("[]"),

    /** Structured JSON string of RAG-retrieved relevant historical episodes */
    ragRetrievedContext: text("rag_retrieved_context").default("[]"),

    /** Structured JSON string of actionable clinical recommendations */
    actionableRecommendations: text("actionable_recommendations").default("[]"),

    /** Complete markdown summary */
    rawMarkdown: text("raw_markdown").default(""),

    /** Timestamp of analysis generation */
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("health_summaries_patient_idx").on(table.patientId),
    index("health_summaries_generated_at_idx").on(table.generatedAt),
  ]
);

