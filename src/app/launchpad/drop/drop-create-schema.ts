"use client";

import * as z from "zod";

export const dropCreateSchema = z.object({
  name: z.string().min(1, "Collection name required").max(100),
  symbol: z
    .string()
    .min(1, "Symbol required")
    .max(10)
    .regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
  supplyCustom: z.string().optional(),
  priceAmount: z.string().optional(),
  paymentToken: z.string(),
  startDate: z.string().min(1, "Start date required"),
  startTime: z.string().default("00:00"),
  endDate: z.string().min(1, "End date required"),
  endTime: z.string().default("23:59"),
  maxPerWallet: z.string().default("1"),
});

export type DropCreateFormValues = z.infer<typeof dropCreateSchema>;
