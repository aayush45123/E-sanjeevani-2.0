DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prescription_status') THEN
        CREATE TYPE "public"."prescription_status" AS ENUM('draft', 'finalized', 'amended');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prescription_item_status') THEN
        CREATE TYPE "public"."prescription_item_status" AS ENUM('active', 'completed', 'discontinued');
    END IF;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
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
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "prescription_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_id" uuid NOT NULL,
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
);--> statement-breakpoint

ALTER TABLE "prescriptions" DROP CONSTRAINT IF EXISTS "prescriptions_consultation_id_consultations_id_fk";
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "prescriptions" DROP CONSTRAINT IF EXISTS "prescriptions_patient_id_users_id_fk";
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "prescriptions" DROP CONSTRAINT IF EXISTS "prescriptions_doctor_id_users_id_fk";
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "prescription_items" DROP CONSTRAINT IF EXISTS "prescription_items_prescription_id_prescriptions_id_fk";
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "prescriptions_patient_idx" ON "prescriptions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prescriptions_doctor_idx" ON "prescriptions" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prescriptions_consultation_idx" ON "prescriptions" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prescriptions_status_idx" ON "prescriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prescription_items_prescription_idx" ON "prescription_items" USING btree ("prescription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prescription_items_status_idx" ON "prescription_items" USING btree ("status");
