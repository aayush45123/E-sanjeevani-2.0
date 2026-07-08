import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["patient", "doctor"]).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const fixPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    plainPassword: z.string().min(6, "Password must be at least 6 characters"),
    adminSecret: z.string().min(1, "Admin secret is required"),
  }),
});
