import { z } from "zod";

export const saveMessageSchema = z.object({
  params: z.object({
    consultationId: z.string().uuid("Invalid consultation ID format"),
  }),
  body: z.object({
    consultationId: z.string().uuid("Invalid consultation ID format"),
    text: z.string().min(1, "Message text cannot be empty"),
    senderName: z.string().optional(),
  }),
});

export const getMessagesSchema = z.object({
  params: z.object({
    consultationId: z.string().uuid("Invalid consultation ID format"),
  }),
});
