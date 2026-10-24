"use client";

import * as z from "zod";
import { FIELD_LIMITS } from "@medialane/sdk";

function parseDateTime(date: string, time: string): number | null {
  const timestamp = new Date(`${date}T${time}:00`).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export const popCreateSchema = z
  .object({
    name: z.string().min(1, "Event name required").max(FIELD_LIMITS.name),
    symbol: z
      .string()
      .min(1, "Symbol required")
      .max(FIELD_LIMITS.symbol)
      .regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
    description: z.string().max(FIELD_LIMITS.description).optional(),
    external_link: z
      .string()
      .max(500)
      .refine((v) => !v || v.startsWith("http://") || v.startsWith("https://"), {
        message: "Must start with http:// or https://",
      })
      .optional(),
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
