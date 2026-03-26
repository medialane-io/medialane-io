/**
 * User preferences for Chipi session keys (Clerk unsafeMetadata.chipiSessionPreferences).
 * Amount caps are enforced in-app only — not an on-chain Chipi feature.
 */

import type { ApiOrder } from "@medialane/sdk";

export type SessionPreferenceMode = "duration" | "amount_capped";

export type ChipiSessionPreferences = {
  enabled: boolean;
  mode: SessionPreferenceMode;
  /** Used when mode === "duration" (minutes). */
  durationMinutes: number;
  /** Human USDC amount string when mode === "amount_capped" (e.g. "100.50"). */
  maxUsdcAmount?: string;
  maxCalls?: number;
};

export const DEFAULT_SESSION_DURATION_SECONDS = 6 * 60 * 60;
export const DEFAULT_SESSION_MAX_CALLS = 1000;
export const MIN_SESSION_DURATION_MINUTES = 5;
/** Upper bound for time-based sessions (48 hours). */
export const MAX_SESSION_DURATION_MINUTES = 48 * 60;
/** Long session for amount-capped mode (7 days) — not “permanent”; on-chain expiry still applies. */
export const AMOUNT_CAPPED_SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;
export const AMOUNT_CAPPED_DEFAULT_MAX_CALLS = 2000;

export function clampDurationMinutes(mins: number): number {
  return Math.min(
    Math.max(MIN_SESSION_DURATION_MINUTES, Math.floor(mins)),
    MAX_SESSION_DURATION_MINUTES
  );
}

export function resolveSessionCreationParams(
  prefs: ChipiSessionPreferences | null | undefined,
  override?: Partial<{ durationSeconds: number; maxCalls: number }>
): { durationSeconds: number; maxCalls: number } {
  const defaults = {
    durationSeconds: DEFAULT_SESSION_DURATION_SECONDS,
    maxCalls: DEFAULT_SESSION_MAX_CALLS,
  };
  if (override?.durationSeconds != null || override?.maxCalls != null) {
    return {
      durationSeconds: override.durationSeconds ?? defaults.durationSeconds,
      maxCalls: override.maxCalls ?? defaults.maxCalls,
    };
  }
  if (!prefs?.enabled) return defaults;
  if (prefs.mode === "duration") {
    const mins = clampDurationMinutes(prefs.durationMinutes ?? 60);
    return {
      durationSeconds: mins * 60,
      maxCalls: prefs.maxCalls ?? DEFAULT_SESSION_MAX_CALLS,
    };
  }
  return {
    durationSeconds: AMOUNT_CAPPED_SESSION_DURATION_SECONDS,
    maxCalls: prefs.maxCalls ?? AMOUNT_CAPPED_DEFAULT_MAX_CALLS,
  };
}

export function shouldClearSessionForAmountCap(
  prefs: ChipiSessionPreferences | null | undefined,
  amountUsdc: number
): boolean {
  if (!prefs?.enabled || prefs.mode !== "amount_capped") return false;
  const cap = parseFloat(prefs.maxUsdcAmount ?? "");
  if (!Number.isFinite(cap) || cap <= 0) return false;
  return amountUsdc > cap;
}

/** Parse listing/offer form price as USDC (human decimal). */
export function parseFormPriceUsdc(priceStr: string): number {
  const n = parseFloat(priceStr.trim());
  return Number.isFinite(n) ? n : 0;
}

/** Order sale price as USDC number using raw + decimals from API. */
export function orderPriceToUsdcNumber(order: ApiOrder): number {
  const raw = order.price?.raw;
  const decimals = order.price?.decimals ?? 6;
  if (!raw) return 0;
  try {
    return Number(BigInt(raw)) / 10 ** decimals;
  } catch {
    return 0;
  }
}
