"use client";

import * as z from "zod";

export const popCreateSchema = z.object({
  name: z.string().min(1, "Event name required").max(100),
  symbol: z
    .string()
    .min(1, "Symbol required")
    .max(10)
    .regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
  claimEndDate: z.string().min(1, "Claim end date required"),
  claimEndTime: z.string().default("23:59"),
});

export type PopCreateFormValues = z.infer<typeof popCreateSchema>;
