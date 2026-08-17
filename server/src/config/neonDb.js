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

This driver supports interactive transactions:

await db.transaction(async (tx) => {
  ...
});
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

    // 3. Check if prescription_items table has updated prescription_id column
    const colCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'prescription_items' AND column_name = 'prescription_id'
    `);

    if (colCheck.rows.length === 0) {
      // Table exists with old legacy schema — drop old table
      await pool.query(`DROP TABLE IF EXISTS "prescription_items" CASCADE;`);
    }

    // 4. Create prescription_items table
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

export const checkPostgresConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");

    console.log("Neon PostgreSQL Connected");
    console.log("Database time:", result.rows[0].current_time);

    await ensurePrescriptionTablesExist();

    return true;
  } catch (error) {
    console.error("Neon PostgreSQL Connection Error:", error);

    throw error;
  }
};
