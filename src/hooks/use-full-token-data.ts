"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api-fetch";

export interface FullTokenData {
  owner: string;
  metadataUri: string;
  originalCreator: string;
  registeredAt: number; // unix seconds
}

interface UseFullTokenDataArgs {
  ipNftAddress: string | undefined;
  tokenId: bigint | undefined;
}

/**
 * Wraps the audited IPNft.get_full_token_data view, served by the backend's
 * metered GET /v1/ipnft/:contract/:tokenId pass-through
 * (medialane-backend/src/api/routes/ipnft-onchain.ts) — the backend does the
 * same on-chain read server-side, credited, instead of the browser reading
 * the chain directly via keyless public RPC.
 * Returns owner + metadata URI + original creator + mint timestamp in a single read.
 * Returns null for tokens whose contract does not implement get_full_token_data
 * (legacy / external collections) — callers must treat null as "no signal".
 */
export function useFullTokenData({ ipNftAddress, tokenId }: UseFullTokenDataArgs) {
  const enabled = Boolean(ipNftAddress && tokenId !== undefined);

  const { data, error, isLoading } = useSWR<FullTokenData | null>(
    enabled ? ["full-token-data", ipNftAddress, tokenId!.toString()] : null,
    async () => {
      const { data } = await apiFetch<{ data: FullTokenData | null }>(
        `/v1/ipnft/${ipNftAddress}/${tokenId!.toString()}`
      );
      return data;
    },
    { revalidateOnFocus: false, refreshInterval: 0 }
  );

  return { data: data ?? null, isLoading, error };
}
