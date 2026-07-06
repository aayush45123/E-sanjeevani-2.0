import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["patient", "doctor"]);

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const patientGenderEnum = pgEnum("patient_gender", [
  "Male",
  "Female",
  "Other",
]);

export const bloodGroupEnum = pgEnum("blood_group", [
  "A+",
  "A-",
  "B+",
  "B-",
  "O+",
  "O-",
  "AB+",
  "AB-",
]);

export const maritalStatusEnum = pgEnum("marital_status", [
  "Single",
  "Married",
  "Divorced",
]);

export const yesNoEnum = pgEnum("yes_no", ["Yes", "No"]);

export const dietEnum = pgEnum("diet_type", [
  "Vegetarian",
  "Non-Vegetarian",
  "Vegan",
]);

export const exerciseEnum = pgEnum("exercise_frequency", [
  "Daily",
  "Weekly",
  "Rarely",
  "Never",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "verified",
  "rejected",
]);

export const consultationModeEnum = pgEnum("consultation_mode", [
  "video",
  "call",
  "chat",
]);

export const consultationStatusEnum = pgEnum("consultation_status", [
  "scheduled",
  "ongoing",
  "completed",
  "cancelled",
  "missed",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
]);

export const senderRoleEnum = pgEnum("sender_role", ["doctor", "patient"]);

export const messageTypeEnum = pgEnum("message_type", ["text", "system"]);

export const urgencyLevelEnum = pgEnum("urgency_level", [
  "low",
  "moderate",
  "high",
  "critical",
]);

export const triageStatusEnum = pgEnum("triage_status", [
  "pending",
  "completed",
  "awaiting_doctor",
  "assigned_doctor",
]);
