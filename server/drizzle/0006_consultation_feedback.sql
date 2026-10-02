CREATE TABLE IF NOT EXISTS "consultation_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'consultation_feedback_consultation_id_consultations_id_fk'
  ) THEN
    ALTER TABLE "consultation_feedback" ADD CONSTRAINT "consultation_feedback_consultation_id_consultations_id_fk"
    FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'consultation_feedback_patient_id_users_id_fk'
  ) THEN
    ALTER TABLE "consultation_feedback" ADD CONSTRAINT "consultation_feedback_patient_id_users_id_fk"
    FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'consultation_feedback_doctor_id_users_id_fk'
  ) THEN
    ALTER TABLE "consultation_feedback" ADD CONSTRAINT "consultation_feedback_doctor_id_users_id_fk"
    FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "feedback_consultation_idx" ON "consultation_feedback" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_doctor_idx" ON "consultation_feedback" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_patient_idx" ON "consultation_feedback" USING btree ("patient_id");
