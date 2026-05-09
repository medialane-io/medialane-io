"use client";

import * as z from "zod";
import { AI_POLICIES, DERIVATIVES_OPTIONS, IP_TYPES } from "@/types/ip";

export const nftEditionsMintSchema = z.object({
  value: z
    .string()
    .min(1, "Quantity required")
    .regex(/^\d+$/, "Must be a positive integer")
    .refine((v) => parseInt(v, 10) >= 1, "Minimum 1"),
  recipient: z
    .string()
    .min(1, "Recipient address required")
    .regex(/^0x[0-9a-fA-F]+$/, "Enter a valid Starknet address"),
  name: z.string().min(1, "Token name required").max(100),
  description: z.string().max(500).optional(),
  external_url: z
    .string()
    .max(500)
    .refine((value) => !value || value.startsWith("http://") || value.startsWith("https://"), {
      message: "Must start with http:// or https://",
    })
    .optional(),
  ipType: z.enum(IP_TYPES),
  licenseType: z.string().min(1, "License required"),
  commercialUse: z.enum(["Yes", "No"]),
  derivatives: z.enum(DERIVATIVES_OPTIONS),
  attribution: z.enum(["Required", "Not Required"]),
  geographicScope: z.string(),
  aiPolicy: z.enum(AI_POLICIES),
  royalty: z.coerce.number().min(0).max(50),
});

export type NftEditionsMintFormValues = z.infer<typeof nftEditionsMintSchema>;
