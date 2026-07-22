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
      .optional(),
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

export const sendChatMessageSchema = z.object({
  body: z.object({
    triageSessionId: z.string().uuid("Invalid session ID format").optional().nullable(),
    prompt: z.string().min(1, "Message prompt cannot be empty"),
    model: z.string().optional(),
  }),
});

export const deleteSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid("Invalid triage session ID format"),
  }),
});

