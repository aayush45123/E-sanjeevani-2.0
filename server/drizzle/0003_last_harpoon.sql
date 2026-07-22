CREATE TABLE "triage_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"triage_session_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "triage_messages" ADD CONSTRAINT "triage_messages_triage_session_id_triage_sessions_id_fk" FOREIGN KEY ("triage_session_id") REFERENCES "public"."triage_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triage_messages" ADD CONSTRAINT "triage_messages_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "triage_messages_session_created_idx" ON "triage_messages" USING btree ("triage_session_id","created_at");--> statement-breakpoint
CREATE INDEX "triage_messages_patient_idx" ON "triage_messages" USING btree ("patient_id");