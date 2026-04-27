"use client";

import useSWR from "swr";
import { Contract, cairo, num } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { COLLECTION_721_CONTRACT } from "@/lib/constants";
import { CollectionRegistryABI } from "@medialane/sdk";

export interface UserCollection {
  /** Numeric collection ID assigned by the registry (u256 as decimal string) */
  onChainId: string;
  /** ERC-721 contract address (ip_nft field) */
  contractAddress: string;
  name: string;
  symbol: string;
}

async function fetchUserCollections(address: string): Promise<UserCollection[]> {
  const contract = new Contract(CollectionRegistryABI as any, COLLECTION_721_CONTRACT, starknetProvider);

  // Use "latest" block — Alchemy v0_10 does not support the default "pending" block tag
  const rawIds = await contract.call("list_user_collections", [address], {
    blockIdentifier: "latest",
  });
  const ids: any[] = Array.isArray(rawIds) ? rawIds : rawIds != null ? [rawIds] : [];
  if (ids.length === 0) return [];

  const results = await Promise.allSettled(
    ids.map(async (idRaw: any) => {
      // id may be bigint or { low, high }
      const id: bigint =
        typeof idRaw === "bigint"
          ? idRaw
          : typeof idRaw === "object" && "low" in idRaw
          ? BigInt(idRaw.low) + (BigInt(idRaw.high) << 128n)
          : BigInt(idRaw);

      const col = await contract.call("get_collection", [cairo.uint256(id)], {
        blockIdentifier: "latest",
      }) as Record<string, unknown>;

      // ip_nft is a ContractAddress — decoded as bigint or hex string by starknet.js
      const ipNftRaw = col.ip_nft ?? col["ip_nft"];
      const contractAddress = ipNftRaw
        ? "0x" + num.toBigInt(String(ipNftRaw)).toString(16).padStart(64, "0")
        : "";

      if (!contractAddress || contractAddress === "0x" + "0".repeat(64)) return null;

      return {
        onChainId: id.toString(),
        contractAddress,
        name: typeof col.name === "string" ? col.name : "",
        symbol: typeof col.symbol === "string" ? col.symbol : "",
      } as UserCollection;
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<UserCollection | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((c): c is UserCollection => c !== null);
}

/**
 * Fetch collections owned by `address` directly from the on-chain collection registry.
 * Returns `onChainId` (numeric collection ID) + `contractAddress` (ERC-721 address) + display metadata.
 */
export function useUserCollections(address: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    address ? `user-collections-${address}` : null,
    () => fetchUserCollections(address!),
    { revalidateOnFocus: false, refreshInterval: 12000 }
  );

  return { collections: data ?? [], isLoading, error, mutate };
}
