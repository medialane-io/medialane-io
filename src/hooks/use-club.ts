"use client";

import useSWR from "swr";
import { Contract, cairo, type Abi } from "starknet";
import { IPClubCollectionABI } from "@medialane/sdk/starknet";
import { starknetProvider } from "@/lib/starknet";
import { apiFetch } from "@/lib/api-fetch";
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
// Per-tier membership record (supply, minted count, validity window, royalty),
// served by the backend's metered GET /v1/club/:contract/:tokenId pass-through
// (medialane-backend/src/api/routes/club-onchain.ts) — the backend does the
// same get_membership(token_id) read server-side, credited, instead of the
// browser reading the chain directly and evading the credit gate.

export interface MembershipOnchain {
  maxSupply: bigint;
  minted: bigint;
  startTime: number | null;
  endTime: number | null;
  royaltyBps: number;
}

interface MembershipOnchainResponse {
  maxSupply: string;
  minted: string;
  startTime: number | null;
  endTime: number | null;
  royaltyBps: number;
}

async function readMembership(contract: string, tokenId: string): Promise<MembershipOnchain> {
  const { data } = await apiFetch<{ data: MembershipOnchainResponse }>(`/v1/club/${contract}/${tokenId}`);
  return {
    maxSupply: BigInt(data.maxSupply),
    minted: BigInt(data.minted),
    startTime: data.startTime,
    endTime: data.endTime,
    royaltyBps: data.royaltyBps,
  };
}

// ── useMembershipList ─────────────────────────────────────────────────────────
// All membership tiers in a club. Tier ids are sequential from 1 and there is
// no count getter, so we probe the backend read above until the first miss
// (capped). This includes tiers that have never been minted — which the
// indexer can't know about yet.

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
//
// This is the one on-chain-direct read left in this file, deliberately: it
// runs immediately before submitting create_membership+mint in the same
// multicall and needs the freshest possible on-chain count for that to be
// correct — same class as a nonce or fee-estimate read, not a discovery read
// that the credited backend could serve instead (same precedent as the
// dapp's ticket-id prediction).
async function countMembershipsOnchain(contract: string): Promise<number> {
  const col = new Contract({ abi: IPClubCollectionABI as unknown as Abi, address: contract, providerOrAccount: starknetProvider });
  let count = 0;
  for (let id = 1; id <= MEMBERSHIP_PROBE_CAP; id++) {
    try {
      await col.call("get_membership", [cairo.uint256(id)]);
      count += 1;
    } catch {
      break; // sequential ids — first miss is the end
    }
  }
  return count;
}

export async function predictNextMembershipId(contract: string): Promise<number> {
  const count = await countMembershipsOnchain(contract);
  if (count >= MEMBERSHIP_PROBE_CAP) {
    // The probe capped out, so the next id can't be known reliably — minting
    // against a guessed id could land supply in an existing tier.
    throw new Error("This club has reached the maximum number of membership tiers supported by the app.");
  }
  return count + 1;
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
      const { data } = await apiFetch<{ data: { isMember: boolean } }>(
        `/v1/club/${contract}/${tokenId}/member/${wallet}`
      );
      return data.isMember;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { isMember: data ?? false, isLoading, error };
}
