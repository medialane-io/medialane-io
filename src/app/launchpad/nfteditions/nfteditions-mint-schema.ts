"use client";

import * as z from "zod";

export const nftEditionsMintSchema = z.object({
  tokenId: z
    .string()
    .min(1, "Token ID required")
    .regex(/^\d+$/, "Must be a positive integer"),
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
});

export type NftEditionsMintFormValues = z.infer<typeof nftEditionsMintSchema>;
