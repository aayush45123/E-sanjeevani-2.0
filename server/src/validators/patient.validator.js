import { z } from "zod";

export const createPatientProfileSchema = z.object({
  body: z.object({
    age: z.coerce.number().int().min(0, "Age must be a positive integer"),
    gender: z.string().min(1, "Gender is required"),
    bloodGroup: z.string().min(1, "Blood group is required"),
    maritalStatus: z.string().min(1, "Marital status is required"),
    height: z.coerce.number().positive("Height must be positive"),
    weight: z.coerce.number().positive("Weight must be positive"),
    smoking: z.string().min(1, "Smoking status is required"),
    alcohol: z.string().min(1, "Alcohol status is required"),
    diet: z.string().min(1, "Diet is required"),
    exercise: z.string().min(1, "Exercise status is required"),
    bloodPressure: z.string().optional(),
    allergies: z.string().optional(),
    chronicConditions: z.string().optional(),
    currentMedications: z.string().optional(),
    pastSurgeries: z.string().optional(),
  }),
});

export const updatePatientProfileSchema = z.object({
  body: z.object({
    age: z.coerce.number().int().min(0).optional(),
    gender: z.string().optional(),
    bloodGroup: z.string().optional(),
    maritalStatus: z.string().optional(),
    height: z.coerce.number().positive().optional(),
    weight: z.coerce.number().positive().optional(),
    smoking: z.string().optional(),
    alcohol: z.string().optional(),
    diet: z.string().optional(),
    exercise: z.string().optional(),
    bloodPressure: z.string().optional(),
    allergies: z.string().optional(),
    chronicConditions: z.string().optional(),
    currentMedications: z.string().optional(),
    pastSurgeries: z.string().optional(),
  }),
});
