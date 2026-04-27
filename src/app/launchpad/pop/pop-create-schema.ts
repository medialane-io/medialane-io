"use client";

import * as z from "zod";

function parseDateTime(date: string, time: string): number | null {
  const timestamp = new Date(`${date}T${time}:00`).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export const popCreateSchema = z
  .object({
    name: z.string().min(1, "Event name required").max(100),
    symbol: z
      .string()
      .min(1, "Symbol required")
      .max(10)
      .regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
    claimEndDate: z.string().min(1, "Claim end date required"),
    claimEndTime: z.string().default("23:59"),
  })
  .superRefine((values, context) => {
    const claimEndTimestamp = parseDateTime(values.claimEndDate, values.claimEndTime);

    if (claimEndTimestamp === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["claimEndDate"],
        message: "Enter a valid claim end date and time",
      });
      return;
    }

    if (claimEndTimestamp <= Date.now()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["claimEndDate"],
        message: "Claim window must end in the future",
      });
    }
  });

export type PopCreateFormValues = z.infer<typeof popCreateSchema>;
