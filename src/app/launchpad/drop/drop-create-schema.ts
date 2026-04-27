"use client";

import * as z from "zod";

function parseDateTime(date: string, time: string): number | null {
  const timestamp = new Date(`${date}T${time}:00`).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export const dropCreateSchema = z
  .object({
    name: z.string().min(1, "Collection name required").max(100),
    symbol: z
      .string()
      .min(1, "Symbol required")
      .max(10)
      .regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
    supplyCustom: z.string().optional(),
    priceAmount: z
      .string()
      .default("")
      .refine((value: string) => value === "" || !Number.isNaN(Number(value)), "Enter a valid price")
      .refine((value: string) => value === "" || Number(value) >= 0, "Price must be zero or greater"),
    paymentToken: z.string(),
    startDate: z.string().min(1, "Start date required"),
    startTime: z.string().default("00:00"),
    endDate: z.string().min(1, "End date required"),
    endTime: z.string().default("23:59"),
    maxPerWallet: z
      .string()
      .regex(/^\d+$/, "Must be a positive integer")
      .refine((value: string) => parseInt(value, 10) >= 1, "Minimum 1")
      .default("1"),
  })
  .superRefine((values, context) => {
    const startTimestamp = parseDateTime(values.startDate, values.startTime);
    const endTimestamp = parseDateTime(values.endDate, values.endTime);

    if (startTimestamp === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "Enter a valid start date and time",
      });
    }

    if (endTimestamp === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Enter a valid end date and time",
      });
    }

    if (startTimestamp !== null && endTimestamp !== null && endTimestamp <= startTimestamp) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End time must be after the start time",
      });
    }
  });

export type DropCreateFormValues = z.infer<typeof dropCreateSchema>;
