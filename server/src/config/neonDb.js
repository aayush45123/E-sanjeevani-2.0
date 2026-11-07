import "dotenv/config";

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "../database/schema/index.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from server/.env");
}

/*
Required when @neondatabase/serverless runs
inside a Node.js environment.
*/
neonConfig.webSocketConstructor = ws;

/*
Create one shared connection pool for the application.
Do NOT create a new Pool inside controllers.
*/
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/*
Drizzle database instance.
*/
export const db = drizzle(pool, {
  schema,
});

export const ensurePrescriptionTablesExist = async () => {
  try {
    // 1. Ensure enum types exist
    await pool.query(`
      DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prescription_status') THEN
              CREATE TYPE "prescription_status" AS ENUM ('draft', 'finalized', 'amended');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prescription_item_status') THEN
              CREATE TYPE "prescription_item_status" AS ENUM ('active', 'completed', 'discontinued');
          END IF;
      END $$;
    `);

    // 2. Create prescriptions table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "prescriptions" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "consultation_id" uuid NOT NULL REFERENCES "consultations"("id") ON DELETE CASCADE,
          "patient_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "doctor_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "diagnosis" text DEFAULT '' NOT NULL,
          "advice" text DEFAULT '',
          "recommended_tests" text DEFAULT '',
          "referral_info" text DEFAULT '',
          "follow_up_instructions" text DEFAULT '',
          "follow_up_required" boolean DEFAULT false NOT NULL,
          "follow_up_days" integer,
          "doctor_notes" text DEFAULT '',
          "status" "prescription_status" DEFAULT 'draft' NOT NULL,
          "amended_from_id" uuid,
          "pdf_url" varchar(2048) DEFAULT '',
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // 3. Create prescription_items table if not exists (Destructive DROP TABLE removed for production safety)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "prescription_items" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "prescription_id" uuid NOT NULL REFERENCES "prescriptions"("id") ON DELETE CASCADE,
          "medicine_name" varchar(255) NOT NULL,
          "dosage" varchar(100) NOT NULL,
          "route" varchar(100) DEFAULT 'Oral',
          "frequency" varchar(100) NOT NULL,
          "duration" varchar(100) NOT NULL,
          "instructions" varchar(255) DEFAULT '',
          "start_date" timestamp with time zone DEFAULT now(),
          "end_date" timestamp with time zone,
          "status" "prescription_item_status" DEFAULT 'active' NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS "prescriptions_patient_idx" ON "prescriptions" ("patient_id");
      CREATE INDEX IF NOT EXISTS "prescriptions_doctor_idx" ON "prescriptions" ("doctor_id");
      CREATE INDEX IF NOT EXISTS "prescriptions_consultation_idx" ON "prescriptions" ("consultation_id");
      CREATE INDEX IF NOT EXISTS "prescriptions_status_idx" ON "prescriptions" ("status");
      CREATE INDEX IF NOT EXISTS "prescription_items_prescription_idx" ON "prescription_items" ("prescription_id");
      CREATE INDEX IF NOT EXISTS "prescription_items_status_idx" ON "prescription_items" ("status");
    `);

    console.log("✅ Prescription database schema verified & updated successfully");
  } catch (err) {
    console.error("⚠️ Failed to ensure prescription tables exist:", err.message);
  }
};

/**
 * Ensures PostgreSQL tables for AI-Powered Longitudinal Health Intelligence exist:
 *  - patient_health_metrics: stores timestamped vital signs & lab biomarkers
 *  - patient_health_summaries: stores AI-generated longitudinal health summaries
 */
export const ensureLongitudinalHealthTablesExist = async () => {
  try {
    // 1. Create patient_health_metrics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "patient_health_metrics" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "patient_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "consultation_id" uuid REFERENCES "consultations"("id") ON DELETE SET NULL,
          "recorded_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
          "recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
          "systolic_bp" integer,
          "diastolic_bp" integer,
          "heart_rate" integer,
          "temperature" real,
          "temperature_unit" varchar(10) DEFAULT 'F' NOT NULL,
          "spo2" integer,
          "respiratory_rate" integer,
          "blood_glucose" real,
          "glucose_type" varchar(30) DEFAULT 'random',
          "weight" real,
          "height" real,
          "bmi" real,
          "platelet_count" integer,
          "wbc_count" integer,
          "hemoglobin" real,
          "crp" real,
          "mews_score" integer DEFAULT 0,
          "notes" text DEFAULT '',
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS "health_metrics_patient_idx" ON "patient_health_metrics" ("patient_id");
      CREATE INDEX IF NOT EXISTS "health_metrics_consultation_idx" ON "patient_health_metrics" ("consultation_id");
      CREATE INDEX IF NOT EXISTS "health_metrics_recorded_at_idx" ON "patient_health_metrics" ("recorded_at");
    `);

    // 2. Create patient_health_summaries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "patient_health_summaries" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "patient_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "clinical_synopsis" text NOT NULL,
          "recurrent_symptoms" text DEFAULT '[]',
          "worsening_trends" text DEFAULT '[]',
          "comparative_metrics" text DEFAULT '[]',
          "rag_retrieved_context" text DEFAULT '[]',
          "actionable_recommendations" text DEFAULT '[]',
          "raw_markdown" text DEFAULT '',
          "generated_at" timestamp with time zone DEFAULT now() NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS "health_summaries_patient_idx" ON "patient_health_summaries" ("patient_id");
      CREATE INDEX IF NOT EXISTS "health_summaries_generated_at_idx" ON "patient_health_summaries" ("generated_at");
    `);

    console.log("✅ Longitudinal Patient Health Intelligence database tables verified successfully");
  } catch (err) {
    console.error("⚠️ Failed to ensure longitudinal health tables exist:", err.message);
  }
};

export const checkPostgresConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");

    console.log("Neon PostgreSQL Connected");
    console.log("Database time:", result.rows[0].current_time);

    await ensurePrescriptionTablesExist();
    await ensureLongitudinalHealthTablesExist();

    return true;
  } catch (error) {
    console.error("Neon PostgreSQL Connection Error:", error);

    throw error;
  }
};
