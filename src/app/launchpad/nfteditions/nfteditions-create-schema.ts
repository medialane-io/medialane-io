"use client";

import * as z from "zod";

export const nftEditionsCreateSchema = z.object({
  name: z.string().min(1, "Name required").max(100),
  symbol: z
    .string()
    .min(1, "Symbol required")
    .max(10, "Max 10 characters")
    .regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
  description: z.string().max(500).optional(),
  external_link: z
    .string()
    .max(500)
    .refine((value) => !value || value.startsWith("http://") || value.startsWith("https://"), {
      message: "Must start with http:// or https://",
    })
    .optional(),
});

export type NftEditionsCreateFormValues = z.infer<typeof nftEditionsCreateSchema>;
