import { z } from "zod";

const stringOrArray = z.union([z.string(), z.array(z.string())]);

export const doctorProfileSchema = z.object({
  body: z.object({
    phone: z.string().trim().min(1, "phone is required"),
    gender: z.string().min(1, "gender is required"),
    dateOfBirth: z.string().min(1, "dateOfBirth is required"),
    specialization: z.string().trim().min(1, "specialization is required"),
    superSpecialization: z.string().optional(),
    qualification: z.string().trim().min(1, "qualification is required"),
    medicalRegistrationNumber: z.string().trim().min(1, "medicalRegistrationNumber is required"),
    experience: z.union([z.number(), z.string()]).refine((val) => {
      const num = Number(val);
      return Number.isInteger(num) && num >= 0;
    }, "Experience must be a non-negative integer"),
    hospitalName: z.string().trim().min(1, "hospitalName is required"),
    consultationFee: z.union([z.number(), z.string()]).refine((val) => {
      const num = Number(val);
      return !Number.isNaN(num) && num >= 0;
    }, "Consultation fee must be a non-negative number"),
    languagesSpoken: stringOrArray.optional(),
    workingDays: stringOrArray.optional(),
    startTime: z.string().min(1, "startTime is required"),
    endTime: z.string().min(1, "endTime is required"),
    consultationModes: stringOrArray.optional(),
    aboutDoctor: z.string().optional(),
    shortBio: z.string().optional(),
    hasClinic: z.union([z.boolean(), z.string()]).optional(),
    clinicAddress: z
      .object({
        apartment: z.string().optional().nullable(),
        street: z.string().optional().nullable(),
        district: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        pinCode: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        coordinates: z
          .object({
            type: z.string().optional(),
            coordinates: z.array(z.number()).optional(),
          })
          .optional()
          .nullable(),
      })
      .optional()
      .nullable(),
    clinicLatitude: z.union([z.number(), z.string()]).optional().nullable(),
    clinicLongitude: z.union([z.number(), z.string()]).optional().nullable(),
  }),
});
