"use client";

import useSWR from "swr";
import { Contract, cairo, num, type Abi } from "starknet";
import { IPNftABI } from "@medialane/sdk";
import { starknetProvider } from "@/lib/starknet";

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
 * Wraps the audited IPNft.get_full_token_data view.
 * Returns owner + metadata URI + original creator + mint timestamp in a single read.
 * Returns null for tokens whose contract does not implement get_full_token_data
 * (legacy / external collections) — callers must treat null as "no signal".
 */
export function useFullTokenData({ ipNftAddress, tokenId }: UseFullTokenDataArgs) {
  const enabled = Boolean(ipNftAddress && tokenId !== undefined);

  const { data, error, isLoading } = useSWR<FullTokenData | null>(
    enabled ? ["full-token-data", ipNftAddress, tokenId!.toString()] : null,
    async () => {
      const contract = new Contract(IPNftABI as unknown as Abi, ipNftAddress!, starknetProvider);
      try {
        const raw = await contract.call("get_full_token_data", [cairo.uint256(tokenId!)], {
          blockIdentifier: "latest",
        });
        const tuple = raw as unknown as [unknown, unknown, unknown, unknown];
        const ownerRaw = tuple[0];
        const metadataUri = String(tuple[1] ?? "");
        const creatorRaw = tuple[2];
        const registeredAtRaw = tuple[3];

        return {
          owner: "0x" + num.toBigInt(String(ownerRaw)).toString(16).padStart(64, "0"),
          metadataUri,
          originalCreator:
            "0x" + num.toBigInt(String(creatorRaw)).toString(16).padStart(64, "0"),
          registeredAt: Number(num.toBigInt(String(registeredAtRaw))),
        };
      } catch {
        return null;
      }
    },
    { revalidateOnFocus: false, refreshInterval: 0 }
  );

  return { data: data ?? null, isLoading, error };
}
