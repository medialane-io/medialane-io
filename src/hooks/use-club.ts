"use client";

import useSWR from "swr";
import { Contract, cairo, type Abi } from "starknet";
import { IPClubCollectionABI } from "@medialane/sdk";
import { starknetProvider } from "@/lib/starknet";
import { useCollectionsByOwner } from "@/hooks/use-collections";

// ── useMyClubCollections ──────────────────────────────────────────────────────
// The signed-in creator's club collections (launchpad browse page).

export function useMyClubCollections(ownerAddress: string | null) {
  const { collections, isLoading, error, mutate } = useCollectionsByOwner(ownerAddress);
  return {
    collections: collections.filter((c) => c.service === "ip-club"),
    isLoading,
    error,
    mutate,
  };
}

// ── useMembershipOnchain ──────────────────────────────────────────────────────
// Per-tier on-chain record via get_membership(token_id) — supply, minted count,
// validity window, royalty. Failover-covered read provider + SWR.

export interface MembershipOnchain {
  maxSupply: bigint;
  minted: bigint;
  startTime: number | null;
  endTime: number | null;
  royaltyBps: number;
}

function parseOption(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "object" && v !== null && "unwrap" in v && typeof (v as { unwrap: unknown }).unwrap === "function") {
    const inner = (v as { unwrap: () => unknown }).unwrap();
    return inner != null ? Number(inner as number | bigint) : null;
  }
  if (typeof v === "bigint" || typeof v === "number") return Number(v);
  return null;
}

async function readMembership(contract: string, tokenId: string): Promise<MembershipOnchain> {
  const col = new Contract(IPClubCollectionABI as unknown as Abi, contract, starknetProvider);
  const m = (await col.call("get_membership", [cairo.uint256(tokenId)])) as {
    max_supply: bigint; minted: bigint; start_time: unknown; end_time: unknown; royalty_bps: bigint | number;
  };
  return {
    maxSupply: BigInt(m.max_supply),
    minted: BigInt(m.minted),
    startTime: parseOption(m.start_time),
    endTime: parseOption(m.end_time),
    royaltyBps: Number(m.royalty_bps),
  };
}

// ── useMembershipList ─────────────────────────────────────────────────────────
// All membership tiers in a club, straight from the chain. Tier ids are
// sequential from 1 and there is no count getter, so we probe get_membership
// until the first miss (capped). This includes tiers that have never been
// minted — which the indexer can't know about yet.

export interface MembershipListItem extends MembershipOnchain {
  id: string;
}

const MEMBERSHIP_PROBE_CAP = 64;

async function readMembershipList(contract: string): Promise<MembershipListItem[]> {
  const memberships: MembershipListItem[] = [];
  for (let id = 1; id <= MEMBERSHIP_PROBE_CAP; id++) {
    try {
      const m = await readMembership(contract, String(id));
      memberships.push({ id: String(id), ...m });
    } catch {
      break; // sequential ids — first miss is the end
    }
  }
  return memberships;
}

// ── predictNextMembershipId ───────────────────────────────────────────────────
// Ids are assigned sequentially on-chain starting at 1, and only the collection
// owner can ever call create_membership. That means the caller creating a new
// tier can safely predict its id ahead of time (current count + 1) and bundle
// create_membership + mint into ONE multicall — one PIN unlock instead of two
// separate transactions for what is, from the creator's point of view, a single
// "create a membership" action.

export async function predictNextMembershipId(contract: string): Promise<number> {
  const memberships = await readMembershipList(contract);
  return memberships.length + 1;
}

export function useMembershipList(contract: string | null) {
  const { data, error, isLoading, mutate } = useSWR<MembershipListItem[]>(
    contract ? `membership-list-${contract}` : null,
    () => readMembershipList(contract!),
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  );

  return { memberships: data ?? [], isLoading, error, mutate };
}

export function useMembershipOnchain(contract: string | null, tokenId: string | null) {
  const { data, error, isLoading } = useSWR<MembershipOnchain>(
    contract && tokenId ? `membership-onchain-${contract}-${tokenId}` : null,
    () => readMembership(contract!, tokenId!),
    { revalidateOnFocus: false, shouldRetryOnError: false, dedupingInterval: 30_000 }
  );

  return { membership: data ?? null, isLoading, error };
}

// ── useIsMemberOf ─────────────────────────────────────────────────────────────
// On-chain member check for one tier — true iff the holder has balance > 0
// AND the current time is inside the tier's validity window.

export function useIsMemberOf(
  contract: string | null,
  tokenId: string | null,
  wallet: string | null
) {
  const key =
    contract && tokenId && wallet ? `is-member-of-${contract}-${tokenId}-${wallet}` : null;

  const { data, error, isLoading } = useSWR<boolean>(
    key,
    async () => {
      const col = new Contract(IPClubCollectionABI as unknown as Abi, contract!, starknetProvider);
      return Boolean(await col.call("is_member_of", [cairo.uint256(tokenId!), wallet!]));
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { isMember: data ?? false, isLoading, error };
}
