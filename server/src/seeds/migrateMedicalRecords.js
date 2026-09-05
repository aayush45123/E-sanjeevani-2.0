import { sql } from "drizzle-orm";
import { db } from "../config/neonDb.js";

async function runMigration() {
  console.log("⚙️ Running Medical Records schema migration...");

  try {
    // 1. Create medical_record_type enum if not exists
    await db.execute(sql`
      DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'medical_record_type') THEN
              CREATE TYPE "public"."medical_record_type" AS ENUM(
                'lab_report',
                'blood_test',
                'scan_report',
                'discharge_summary',
                'medical_certificate',
                'previous_consultation',
                'other'
              );
          END IF;
      END $$;
    `);

    // 2. Drop unique constraint on consultation_id if present
    await db.execute(sql`
      ALTER TABLE "medical_records" DROP CONSTRAINT IF EXISTS "medical_records_consultation_unique";
    `);
    await db.execute(sql`
      DROP INDEX IF EXISTS "medical_records_consultation_unique";
    `);

    // 3. Make consultation_id nullable
    await db.execute(sql`
      ALTER TABLE "medical_records" ALTER COLUMN "consultation_id" DROP NOT NULL;
    `);

    // 4. Add new columns to medical_records
    await db.execute(sql`
      ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "prescription_id" uuid;
    `);
    await db.execute(sql`
      ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "source" varchar(50) DEFAULT 'patient_upload' NOT NULL;
    `);
    await db.execute(sql`
      ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "record_title" varchar(255) DEFAULT '';
    `);
    await db.execute(sql`
      ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "record_type" "public"."medical_record_type" DEFAULT 'other' NOT NULL;
    `);
    await db.execute(sql`
      ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "description" text DEFAULT '';
    `);
    await db.execute(sql`
      ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "uploaded_by" varchar(50) DEFAULT 'patient' NOT NULL;
    `);
    await db.execute(sql`
      ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "record_date" timestamp with time zone DEFAULT now();
    `);
    await db.execute(sql`
      ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "doctor_name" varchar(255) DEFAULT '';
    `);
    await db.execute(sql`
      ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "hospital_name" varchar(255) DEFAULT '';
    `);

    // 5. Foreign keys & indexes
    await db.execute(sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'medical_records_prescription_id_prescriptions_id_fk'
        ) THEN
          ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_prescription_id_prescriptions_id_fk"
          FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await db.execute(sql`
      ALTER TABLE "medical_records" DROP CONSTRAINT IF EXISTS "medical_records_consultation_id_consultations_id_fk";
      ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_consultation_id_consultations_id_fk"
      FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "medical_records_patient_idx" ON "medical_records" USING btree ("patient_id");
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "medical_records_consultation_idx" ON "medical_records" USING btree ("consultation_id");
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "medical_records_prescription_idx" ON "medical_records" USING btree ("prescription_id");
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "medical_records_source_idx" ON "medical_records" USING btree ("source");
    `);

    console.log("✅ Medical Records schema migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
