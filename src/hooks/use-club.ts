"use client";

import useSWR from "swr";
import { Contract, cairo, type Abi } from "starknet";
import { IPClubCollectionABI } from "@medialane/sdk/starknet";
import { starknetProvider } from "@/lib/starknet";
import { apiFetch } from "@/lib/api-fetch";
import { useCollectionsByOwner } from "@/hooks/use-collections";

export function useMyClubCollections(ownerAddress: string | null) {
  const { collections, isLoading, error, mutate } = useCollectionsByOwner(ownerAddress);
  return {
    collections: collections.filter((c) => c.service === "ip-club"),
    isLoading,
    error,
    mutate,
  };
}

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
      break;
    }
  }
  return memberships;
}

async function countMembershipsOnchain(contract: string): Promise<number> {
  const col = new Contract({ abi: IPClubCollectionABI as unknown as Abi, address: contract, providerOrAccount: starknetProvider });
  let count = 0;
  for (let id = 1; id <= MEMBERSHIP_PROBE_CAP; id++) {
    try {
      await col.call("get_membership", [cairo.uint256(id)]);
      count += 1;
    } catch {
      break;
    }
  }
  return count;
}

export async function predictNextMembershipId(contract: string): Promise<number> {
  const count = await countMembershipsOnchain(contract);
  if (count >= MEMBERSHIP_PROBE_CAP) {

    throw new Error("This club has reached the maximum number of membership tiers supported by the app.");
  }
  return count + 1;
}

export function useMembershipOnchain(contract: string | null, tokenId: string | null) {
  const { data, error, isLoading } = useSWR<MembershipOnchain>(
    contract && tokenId ? `membership-onchain-${contract}-${tokenId}` : null,
    () => readMembership(contract!, tokenId!),
    { revalidateOnFocus: false, shouldRetryOnError: false, dedupingInterval: 30_000 }
  );

  return { membership: data ?? null, isLoading, error };
}

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
