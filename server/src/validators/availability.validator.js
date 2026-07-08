import { z } from "zod";

export const createAvailabilitySchema = z.object({
  body: z.object({
    availableDate: z.string().min(1, "availableDate is required"),
    slots: z
      .array(
        z.object({
          startTime: z.string().min(1, "startTime is required"),
          endTime: z.string().min(1, "endTime is required"),
        }),
      )
      .min(1, "At least one slot is required"),
  }),
});

export const getAvailabilitySlotsSchema = z.object({
  params: z.object({
    doctorId: z.string().uuid("Invalid doctor ID format"),
  }),
  query: z.object({
    date: z.string().min(1, "Date query parameter is required"),
  }),
});

export const deleteAvailabilitySchema = z.object({
  params: z.object({
    availabilityId: z.string().uuid("Invalid availability ID format"),
  }),
});
