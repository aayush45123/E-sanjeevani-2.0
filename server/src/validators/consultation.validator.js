import { z } from "zod";

export const getAvailableDoctorsSchema = z.object({
  query: z.object({
    specialization: z.string().optional(),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
  }),
});

export const getDoctorAvailableSlotsSchema = z.object({
  query: z.object({
    doctorId: z.string().uuid("Invalid doctor ID format"),
    date: z.string().min(1, "Date is required"),
  }),
});

export const createConsultationSchema = z.object({
  body: z.object({
    doctorId: z.string().uuid("Invalid doctor ID format"),
    consultationType: z.enum(["video", "call", "chat"]),
    symptoms: z.string().min(1, "Symptoms are required"),
    currentProblem: z
      .string()
      .min(1, "Current problem description is required"),
    currentMedication: z.string().optional(),
    medicalHistory: z.string().optional(),
    allergies: z.string().optional(),
    consultationDate: z.string().min(1, "Consultation date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  }),
});

export const updateConsultationStatusSchema = z.object({
  params: z.object({
    consultationId: z.string().uuid("Invalid consultation ID format"),
  }),
  body: z.object({
    // Normalize casing/hyphenation before validating against the enum, so
    // "In Progress" / "in-progress" / trailing spaces from the client don't
    // trip the ZodError you were seeing — while still rejecting truly bogus values.
    status: z
      .string({ required_error: "Status is required" })
      .trim()
      .toLowerCase()
      .transform((val) => val.replace(/[\s-]+/g, "_"))
      .pipe(
        z.enum([
          "scheduled",
          "ongoing",
          "completed",
          "cancelled",
          "missed",
        ]),
      ),
  }),
});

export const addDoctorNotesSchema = z.object({
  params: z.object({
    consultationId: z.string().uuid("Invalid consultation ID format"),
  }),
  body: z.object({
    doctorNotes: z.string().optional(),
    prescription: z.string().optional(),
    followUpRequired: z.union([z.boolean(), z.string()]).optional(),
  }),
});

export const getDoctorsNearMeSchema = z.object({
  query: z.object({
    latitude: z.string().transform((val) => parseFloat(val)),
    longitude: z.string().transform((val) => parseFloat(val)),
    radius: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
  }),
});

export const markUserJoinedSchema = z.object({
  params: z.object({
    consultationId: z.string().uuid("Invalid consultation ID format"),
  }),
});
