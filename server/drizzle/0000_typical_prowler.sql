CREATE TYPE "public"."blood_group" AS ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-');--> statement-breakpoint
CREATE TYPE "public"."consultation_mode" AS ENUM('video', 'call', 'chat');--> statement-breakpoint
CREATE TYPE "public"."consultation_status" AS ENUM('scheduled', 'ongoing', 'completed', 'cancelled', 'missed');--> statement-breakpoint
CREATE TYPE "public"."diet_type" AS ENUM('Vegetarian', 'Non-Vegetarian', 'Vegan');--> statement-breakpoint
CREATE TYPE "public"."exercise_frequency" AS ENUM('Daily', 'Weekly', 'Rarely', 'Never');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."marital_status" AS ENUM('Single', 'Married', 'Divorced');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'system');--> statement-breakpoint
CREATE TYPE "public"."patient_gender" AS ENUM('Male', 'Female', 'Other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed');--> statement-breakpoint
CREATE TYPE "public"."sender_role" AS ENUM('doctor', 'patient');--> statement-breakpoint
CREATE TYPE "public"."triage_status" AS ENUM('pending', 'completed', 'awaiting_doctor', 'assigned_doctor');--> statement-breakpoint
CREATE TYPE "public"."urgency_level" AS ENUM('low', 'moderate', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('patient', 'doctor');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."yes_no" AS ENUM('Yes', 'No');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"phone" varchar(30),
	"role" "user_role" DEFAULT 'patient' NOT NULL,
	"profile_image" varchar(2048),
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "patient_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"age" integer NOT NULL,
	"gender" "patient_gender" NOT NULL,
	"blood_group" "blood_group" NOT NULL,
	"marital_status" "marital_status" NOT NULL,
	"height" real NOT NULL,
	"weight" real NOT NULL,
	"blood_pressure" varchar(50) DEFAULT '',
	"smoking" "yes_no" NOT NULL,
	"alcohol" "yes_no" NOT NULL,
	"diet" "diet_type" NOT NULL,
	"exercise" "exercise_frequency" NOT NULL,
	"allergies" text DEFAULT '',
	"chronic_conditions" text DEFAULT '',
	"current_medications" text DEFAULT '',
	"past_surgeries" text DEFAULT '',
	"is_profile_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"apartment" varchar(255),
	"street" varchar(500),
	"district" varchar(255),
	"city" varchar(255),
	"pin_code" varchar(20),
	"state" varchar(255),
	"longitude" double precision,
	"latitude" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"phone" varchar(30) NOT NULL,
	"gender" "gender" NOT NULL,
	"date_of_birth" timestamp with time zone NOT NULL,
	"profile_photo" varchar(2048) DEFAULT '',
	"specialization" varchar(255) NOT NULL,
	"super_specialization" varchar(255) DEFAULT '',
	"qualification" varchar(500) NOT NULL,
	"medical_registration_number" varchar(255) NOT NULL,
	"experience" integer NOT NULL,
	"hospital_name" varchar(500) NOT NULL,
	"consultation_fee" numeric(10, 2) NOT NULL,
	"languages_spoken" text[] DEFAULT '{}',
	"working_days" text[] DEFAULT '{}',
	"consultation_modes" text[] DEFAULT '{}',
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"medical_license" varchar(2048) DEFAULT '',
	"degree_certificate" varchar(2048) DEFAULT '',
	"government_id_proof" varchar(2048) DEFAULT '',
	"about_doctor" text DEFAULT '',
	"short_bio" text DEFAULT '',
	"has_clinic" boolean DEFAULT false NOT NULL,
	"clinic_apartment" varchar(255),
	"clinic_street" varchar(500),
	"clinic_district" varchar(255),
	"clinic_city" varchar(255),
	"clinic_pin_code" varchar(20),
	"clinic_state" varchar(255),
	"clinic_longitude" double precision,
	"clinic_latitude" double precision,
	"profile_completed" boolean DEFAULT false NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"consultation_type" "consultation_mode" NOT NULL,
	"symptoms" text NOT NULL,
	"current_problem" text NOT NULL,
	"current_medication" text DEFAULT '',
	"medical_history" text DEFAULT '',
	"allergies" text DEFAULT '',
	"consultation_date" timestamp with time zone NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"status" "consultation_status" DEFAULT 'scheduled' NOT NULL,
	"room_id" varchar(255) DEFAULT '',
	"doctor_notes" text DEFAULT '',
	"prescription" text DEFAULT '',
	"follow_up_required" boolean DEFAULT false NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"reminder_sent" boolean DEFAULT false NOT NULL,
	"reminder_sent_at" timestamp with time zone,
	"patient_joined" boolean DEFAULT false NOT NULL,
	"doctor_joined" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultation_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_id" uuid NOT NULL,
	"file_name" varchar(500),
	"file_url" varchar(2048),
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_availabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"available_date" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"availability_id" uuid NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"is_booked" boolean DEFAULT false NOT NULL,
	"booked_by_id" uuid,
	"consultation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"consultation_id" uuid NOT NULL,
	"diagnosis" text DEFAULT '',
	"prescription" text DEFAULT '',
	"doctor_notes" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_record_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medical_record_id" uuid NOT NULL,
	"file_name" varchar(500),
	"file_url" varchar(2048),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_name" varchar(255),
	"sender_role" "sender_role",
	"text" text NOT NULL,
	"message_type" "message_type" DEFAULT 'text' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_triage_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"symptoms" text NOT NULL,
	"predicted_disease" varchar(500) NOT NULL,
	"urgency" varchar(100) NOT NULL,
	"doctor_type" varchar(255) NOT NULL,
	"final_doctor_diagnosis" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "triage_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"symptoms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"medical_history" text DEFAULT '',
	"current_medications" text DEFAULT '',
	"allergies" text DEFAULT '',
	"additional_notes" text DEFAULT '',
	"urgency_score" integer DEFAULT 0 NOT NULL,
	"urgency_level" "urgency_level" DEFAULT 'low' NOT NULL,
	"status" "triage_status" DEFAULT 'pending' NOT NULL,
	"assigned_doctor_id" uuid,
	"recommended_specialty" varchar(255),
	"summary_title" varchar(500),
	"summary_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "triage_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"triage_session_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"symptoms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"preliminary_assessment" text,
	"possible_conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommended_tests" text[] DEFAULT '{}',
	"recommended_specialties" text[] DEFAULT '{}',
	"urgency_score" integer NOT NULL,
	"urgency_level" "urgency_level" NOT NULL,
	"immediate_recommendations" text[] DEFAULT '{}',
	"lifestyle_advice" text[] DEFAULT '{}',
	"ai_notes" text,
	"should_auto_match_doctor" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_addresses" ADD CONSTRAINT "patient_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_reports" ADD CONSTRAINT "consultation_reports_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_availabilities" ADD CONSTRAINT "doctor_availabilities_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_availability_id_doctor_availabilities_id_fk" FOREIGN KEY ("availability_id") REFERENCES "public"."doctor_availabilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_booked_by_id_users_id_fk" FOREIGN KEY ("booked_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_record_attachments" ADD CONSTRAINT "medical_record_attachments_medical_record_id_medical_records_id_fk" FOREIGN KEY ("medical_record_id") REFERENCES "public"."medical_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_triage_chats" ADD CONSTRAINT "ai_triage_chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triage_sessions" ADD CONSTRAINT "triage_sessions_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triage_sessions" ADD CONSTRAINT "triage_sessions_assigned_doctor_id_users_id_fk" FOREIGN KEY ("assigned_doctor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triage_responses" ADD CONSTRAINT "triage_responses_triage_session_id_triage_sessions_id_fk" FOREIGN KEY ("triage_session_id") REFERENCES "public"."triage_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triage_responses" ADD CONSTRAINT "triage_responses_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "patient_profiles_user_id_unique" ON "patient_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "patient_addresses_user_unique" ON "patient_addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "patient_addresses_city_idx" ON "patient_addresses" USING btree ("city");--> statement-breakpoint
CREATE UNIQUE INDEX "doctor_profiles_user_id_unique" ON "doctor_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "doctor_profiles_registration_unique" ON "doctor_profiles" USING btree ("medical_registration_number");--> statement-breakpoint
CREATE INDEX "doctor_profiles_specialization_idx" ON "doctor_profiles" USING btree ("specialization");--> statement-breakpoint
CREATE INDEX "doctor_profiles_city_idx" ON "doctor_profiles" USING btree ("clinic_city");--> statement-breakpoint
CREATE INDEX "doctor_profiles_verification_status_idx" ON "doctor_profiles" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "consultations_doctor_date_idx" ON "consultations" USING btree ("doctor_id","consultation_date");--> statement-breakpoint
CREATE INDEX "consultations_patient_date_idx" ON "consultations" USING btree ("patient_id","consultation_date");--> statement-breakpoint
CREATE INDEX "consultations_status_idx" ON "consultations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "consultation_reports_consultation_idx" ON "consultation_reports" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "doctor_availabilities_doctor_date_idx" ON "doctor_availabilities" USING btree ("doctor_id","available_date");--> statement-breakpoint
CREATE INDEX "availability_slots_availability_idx" ON "availability_slots" USING btree ("availability_id");--> statement-breakpoint
CREATE INDEX "availability_slots_consultation_idx" ON "availability_slots" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "medical_records_patient_idx" ON "medical_records" USING btree ("patient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "medical_records_consultation_unique" ON "medical_records" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "medical_record_attachments_record_idx" ON "medical_record_attachments" USING btree ("medical_record_id");--> statement-breakpoint
CREATE INDEX "chat_messages_consultation_created_idx" ON "chat_messages" USING btree ("consultation_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_messages_sender_idx" ON "chat_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "ai_triage_chats_user_created_idx" ON "ai_triage_chats" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "triage_sessions_patient_created_idx" ON "triage_sessions" USING btree ("patient_id","created_at");--> statement-breakpoint
CREATE INDEX "triage_sessions_status_idx" ON "triage_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "triage_sessions_assigned_doctor_idx" ON "triage_sessions" USING btree ("assigned_doctor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "triage_responses_session_unique" ON "triage_responses" USING btree ("triage_session_id");--> statement-breakpoint
CREATE INDEX "triage_responses_patient_idx" ON "triage_responses" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "triage_responses_urgency_idx" ON "triage_responses" USING btree ("urgency_level");