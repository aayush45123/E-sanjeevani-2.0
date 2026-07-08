import { z } from "zod";

export const createTriageSessionSchema = z.object({
  body: z.object({
    symptoms: z
      .array(
        z.object({
          symptom: z.string().min(1, "Symptom description is required"),
          severity: z.enum(["mild", "moderate", "severe"]),
          duration: z.string().optional(),
        }),
      )
      .min(1, "At least one symptom is required"),
    medicalHistory: z.string().optional(),
    currentMedications: z.string().optional(),
    allergies: z.string().optional(),
    additionalNotes: z.string().optional(),
  }),
});

export const processTriageSchema = z.object({
  params: z.object({
    triageSessionId: z.string().uuid("Invalid triage session ID format"),
  }),
});

export const triageDetailsSchema = z.object({
  params: z.object({
    triageSessionId: z.string().uuid("Invalid triage session ID format"),
  }),
});
