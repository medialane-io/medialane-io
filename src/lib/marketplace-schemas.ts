import * as z from "zod";
import { getListableTokens } from "@medialane/sdk";

export const marketplacePriceField = z
  .string()
  .min(1, "Price required")
  .refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    "Must be a positive number"
  );

export const marketplaceCurrencyField = z
  .string()
  .refine(
    (v) => getListableTokens().some((t) => t.symbol === v),
    "Invalid currency"
  );

export const marketplaceDurationField = z.number().min(86400);

export const counterOfferDurationField = z.number().int().min(3600);
