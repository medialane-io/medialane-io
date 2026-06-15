"use client";

import * as z from "zod";
import { IP_TYPES } from "@/types/ip";

function parseDateTime(date: string, time: string): number | null {
  const t = new Date(`${date}T${time}:00`).getTime();
  return Number.isNaN(t) ? null : t;
}

export const dropCreateSchema = z
  .object({
    name: z.string().min(1, "Collection name required").max(100),
    symbol: z
      .string()
      .min(1, "Symbol required")
      .max(10)
      .regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
    // ── Shared license defaults — applied to every item (per-item override in the list) ──
    ipType: z.enum(IP_TYPES),
    licenseType: z.string().min(1, "License required"),
    commercialUse: z.string().default(""),
    derivatives: z.string().default(""),
    attribution: z.string().default(""),
    geographicScope: z.string().default("Worldwide"),
    aiPolicy: z.string().default(""),
    royalty: z.coerce.number().min(0).max(50).default(0),
    descriptionTemplate: z.string().max(500).optional(),
    // ── Single public window (M1); presale fields added in M3 ──
    priceAmount: z
      .string()
      .default("")
      .refine((v: string) => v === "" || !Number.isNaN(Number(v)), "Enter a valid price")
      .refine((v: string) => v === "" || Number(v) >= 0, "Price must be zero or greater"),
    paymentToken: z.string(),
    startDate: z.string().min(1, "Start date required"),
    startTime: z.string().default("00:00"),
    endDate: z.string().min(1, "End date required"),
    endTime: z.string().default("23:59"),
    maxPerWallet: z
      .string()
      .regex(/^\d+$/, "Must be a positive integer")
      .refine((v: string) => parseInt(v, 10) >= 1, "Minimum 1")
      .default("1"),
  })
  .superRefine((values, ctx) => {
    const start = parseDateTime(values.startDate, values.startTime);
    const end = parseDateTime(values.endDate, values.endTime);
    if (start === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["startDate"], message: "Enter a valid start date and time" });
    }
    if (end === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "Enter a valid end date and time" });
    }
    if (start !== null && end !== null && end <= start) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "End time must be after the start time" });
    }
  });

export type DropCreateFormValues = z.infer<typeof dropCreateSchema>;
