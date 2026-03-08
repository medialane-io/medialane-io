"use client";

import useSWR from "swr";
import { Contract, cairo, num } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { COLLECTION_CONTRACT } from "@/lib/constants";

// Minimal ABI — only the functions + types we call
const REGISTRY_ABI = [
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      { name: "data", type: "core::array::Array::<core::felt252>" },
      { name: "pending_word", type: "core::felt252" },
      { name: "pending_word_len", type: "core::integer::u32" },
    ],
  },
  {
    type: "struct",
    name: "ip_collection_erc_721::types::Collection",
    members: [
      { name: "name", type: "core::byte_array::ByteArray" },
      { name: "symbol", type: "core::byte_array::ByteArray" },
      { name: "base_uri", type: "core::byte_array::ByteArray" },
      { name: "owner", type: "core::starknet::contract_address::ContractAddress" },
      { name: "ip_nft", type: "core::starknet::contract_address::ContractAddress" },
      { name: "is_active", type: "core::bool" },
    ],
  },
  {
    type: "function",
    name: "list_user_collections",
    inputs: [{ name: "user", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::array::Span::<core::integer::u256>" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_collection",
    inputs: [{ name: "collection_id", type: "core::integer::u256" }],
    outputs: [{ type: "ip_collection_erc_721::types::Collection" }],
    state_mutability: "view",
  },
] as const;

export interface UserCollection {
  /** Numeric collection ID assigned by the registry (u256 as decimal string) */
  onChainId: string;
  /** ERC-721 contract address (ip_nft field) */
  contractAddress: string;
  name: string;
  symbol: string;
}

async function fetchUserCollections(address: string): Promise<UserCollection[]> {
  const contract = new Contract(REGISTRY_ABI as any, COLLECTION_CONTRACT, starknetProvider);

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
      });

      // ip_nft is a ContractAddress — decoded as bigint or hex string by starknet.js
      const ipNftRaw = col.ip_nft ?? col["ip_nft"];
      const contractAddress = ipNftRaw
        ? "0x" + num.toBigInt(ipNftRaw.toString()).toString(16).padStart(64, "0")
        : "";

      if (!contractAddress || contractAddress === "0x" + "0".repeat(64)) return null;

      return {
        onChainId: id.toString(),
        contractAddress,
        name: typeof col.name === "string" ? col.name : "",
        symbol: typeof col.symbol === "string" ? col.symbol : "",
      } satisfies UserCollection;
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
    { revalidateOnFocus: false }
  );

  return { collections: data ?? [], isLoading, error, mutate };
}
