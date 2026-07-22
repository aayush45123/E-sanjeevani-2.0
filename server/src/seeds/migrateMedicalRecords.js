import { sql } from "drizzle-orm";
import { db } from "../config/neonDb.js";

async function runMigration() {
  console.log("⚙️ Running Medical Records schema migration...");

  try {
    // 1. Create prescription_items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "prescription_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "medical_record_id" uuid NOT NULL,
        "medicine_name" varchar(255) NOT NULL,
        "dosage" varchar(100) NOT NULL,
        "frequency" varchar(100) NOT NULL,
        "duration" varchar(100) NOT NULL,
        "instructions" varchar(255) DEFAULT '',
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
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
      ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "source" varchar(50) DEFAULT 'consultation' NOT NULL;
    `);
    await db.execute(sql`
      ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "record_title" varchar(255) DEFAULT '';
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
    await db.execute(sql`
      ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "advice" text DEFAULT '';
    `);
    await db.execute(sql`
      ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "recommended_tests" text DEFAULT '';
    `);
    await db.execute(sql`
      ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "follow_up_required" boolean DEFAULT false NOT NULL;
    `);
    await db.execute(sql`
      ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "follow_up_days" integer;
    `);
    await db.execute(sql`
      ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "prescription_pdf_url" varchar(2048) DEFAULT '';
    `);

    // 5. Add foreign key constraints & indexes
    await db.execute(sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'prescription_items_medical_record_id_medical_records_id_fk'
        ) THEN
          ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_medical_record_id_medical_records_id_fk"
          FOREIGN KEY ("medical_record_id") REFERENCES "public"."medical_records"("id") ON DELETE cascade ON UPDATE no action;
        END IF;
      END $$;
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "prescription_items_record_idx" ON "prescription_items" ("medical_record_id");
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "medical_records_consultation_idx" ON "medical_records" ("consultation_id");
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "medical_records_source_idx" ON "medical_records" ("source");
    `);

    console.log("✅ Medical Records schema migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
