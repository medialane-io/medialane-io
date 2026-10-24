"use client";

import * as z from "zod";
import { FIELD_LIMITS } from "@medialane/sdk";

export const nftEditionsCreateSchema = z.object({
  name: z.string().min(1, "Name required").max(FIELD_LIMITS.name),
  symbol: z
    .string()
    .min(1, "Symbol required")
    .max(FIELD_LIMITS.symbol, `Max ${FIELD_LIMITS.symbol} characters`)
    .regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
  description: z.string().max(FIELD_LIMITS.description).optional(),
  external_link: z
    .string()
    .max(500)
    .refine((value) => !value || value.startsWith("http://") || value.startsWith("https://"), {
      message: "Must start with http:// or https://",
    })
    .optional(),
});

export type NftEditionsCreateFormValues = z.infer<typeof nftEditionsCreateSchema>;
