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
END $$;--> statement-breakpoint

ALTER TABLE "medical_records" DROP CONSTRAINT IF EXISTS "medical_records_consultation_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "medical_records_consultation_unique";--> statement-breakpoint

ALTER TABLE "medical_records" ALTER COLUMN "consultation_id" DROP NOT NULL;--> statement-breakpoint

ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "prescription_id" uuid;--> statement-breakpoint
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "source" varchar(50) DEFAULT 'patient_upload' NOT NULL;--> statement-breakpoint
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "record_title" varchar(255) DEFAULT '';--> statement-breakpoint
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "record_type" "public"."medical_record_type" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "description" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "uploaded_by" varchar(50) DEFAULT 'patient' NOT NULL;--> statement-breakpoint
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "record_date" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "doctor_name" varchar(255) DEFAULT '';--> statement-breakpoint
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "hospital_name" varchar(255) DEFAULT '';--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'follow_up_required'
  ) THEN
    ALTER TABLE "medical_records" ALTER COLUMN "follow_up_required" DROP NOT NULL;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'medical_records_prescription_id_prescriptions_id_fk'
  ) THEN
    ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_prescription_id_prescriptions_id_fk"
    FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;--> statement-breakpoint

ALTER TABLE "medical_records" DROP CONSTRAINT IF EXISTS "medical_records_consultation_id_consultations_id_fk";--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_consultation_id_consultations_id_fk"
FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "medical_records_patient_idx" ON "medical_records" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "medical_records_consultation_idx" ON "medical_records" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "medical_records_prescription_idx" ON "medical_records" USING btree ("prescription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "medical_records_source_idx" ON "medical_records" USING btree ("source");
