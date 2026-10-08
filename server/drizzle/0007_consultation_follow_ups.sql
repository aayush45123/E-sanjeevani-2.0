ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "follow_up_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "follow_up_status" varchar(50) DEFAULT 'due';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consultations_follow_up_idx" ON "consultations" USING btree ("doctor_id", "follow_up_date");
