import * as z from "zod";
import { getListableTokens } from "@medialane/sdk";

/**
 * Shared Zod field schemas for marketplace dialogs.
 * Import individual fields and compose the schema for your dialog.
 *
 * Usage:
 *   import { marketplacePriceField, marketplaceCurrencyField, marketplaceDurationField } from "@/lib/marketplace-schemas";
 *   const schema = z.object({ price: marketplacePriceField, currency: marketplaceCurrencyField, durationSeconds: marketplaceDurationField });
 */

/** Positive numeric string — used by listing, offer, and counter-offer dialogs. */
export const marketplacePriceField = z
  .string()
  .min(1, "Price required")
  .refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    "Must be a positive number"
  );

/**
 * Currency validation against the SDK's listable tokens.
 * z.enum() requires a const tuple — use z.string().refine() for runtime-derived lists.
 * Used by listing and offer dialogs.
 */
export const marketplaceCurrencyField = z
  .string()
  .refine(
    (v) => getListableTokens().some((t) => t.symbol === v),
    "Invalid currency"
  );

/**
 * Duration in seconds with a 24-hour minimum — used by listing and offer dialogs.
 * Listings and offers require at least 1 day duration.
 */
export const marketplaceDurationField = z.number().min(86400);

/**
 * Duration in seconds with a 1-hour minimum — used by counter-offer dialog.
 * Counter-offers allow a shorter minimum duration than listings.
 */
export const counterOfferDurationField = z.number().int().min(3600);
