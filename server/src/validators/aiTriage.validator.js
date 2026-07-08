import { z } from "zod";

export const predictDiseaseSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1, "Symptoms message is required"),
  }),
});
