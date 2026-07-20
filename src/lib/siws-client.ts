"use client";

/**
 * Thin wrapper over @medialane/sdk's SIWS client (single source since 0.44.0
 * — see medialane-core/docs/specs/2026-06-30-remove-clerk-from-backend-
 * design.md §IX; medialane-starknet shares the same source).
 */
import {
  requestSiwsToken as sdkRequestSiwsToken,
  getStoredSiwsToken,
  storeSiwsToken,
  isSiwsTokenValid,
  getSiwsStorageKey,
  normalizeSiwsSignature,
  type SiwsSigner,
  type RequestSiwsTokenArgs as SdkRequestSiwsTokenArgs,
} from "@medialane/sdk/starknet";
import { MEDIALANE_BACKEND_URL } from "@/lib/constants";

export type { SiwsSigner };
export type RequestSiwsTokenArgs = Omit<SdkRequestSiwsTokenArgs, "backendUrl">;
export { getStoredSiwsToken, storeSiwsToken, isSiwsTokenValid, getSiwsStorageKey, normalizeSiwsSignature };

export function requestSiwsToken(args: RequestSiwsTokenArgs): Promise<string> {
  return sdkRequestSiwsToken({ ...args, backendUrl: MEDIALANE_BACKEND_URL });
}
