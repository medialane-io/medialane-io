"use client";

import useSWR from "swr";
import { publicReadProvider } from "@/lib/starknet";
import { apiFetch } from "@/lib/api-fetch";
import { normalizeAddress, type ApiCollection, type ApiMeta } from "@medialane/sdk";

// deploy_club encodes an unlimited member cap as u64::MAX.
const UNLIMITED = 0xffffffffffffffffn;

function u256(res: string[], i = 0): bigint {
  return BigInt(res[i] ?? "0") + (BigInt(res[i + 1] ?? "0") << 128n);
}

export function useClubCollections() {
  const { data, error, isLoading, mutate } = useSWR<{ data: ApiCollection[]; meta: ApiMeta }>(
    "ip-club-collections",
    () =>
      apiFetch<{ data: ApiCollection[]; meta: ApiMeta }>(
        `/v1/collections?${new URLSearchParams({ service: "ip-club", limit: "50" })}`
      ),
    { revalidateOnFocus: false }
  );

  return { collections: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

export interface ClubInfo {
  open: boolean;
  numMembers: number;
  maxMembers: number | null;
  entryFee: string | null;
  paymentToken: string | null;
}

/**
 * Club state read straight from the IPClubCollection contract — the authority
 * (`00 §1`). A club is a standalone ERC-721 deployed by the factory; there is no
 * backend club record. Uses the public read provider so it works signed-out.
 */
export function useClubInfo(clubAddress: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ClubInfo>(
    clubAddress ? `club-info-${clubAddress}` : null,
    async () => {
      const call = (entrypoint: string) =>
        publicReadProvider.callContract({ contractAddress: clubAddress!, entrypoint, calldata: [] });
      const [openR, feeR, tokenR, maxR, mintedR] = await Promise.all([
        call("is_open"),
        call("entry_fee"),
        call("payment_token"),
        call("max_supply"),
        call("total_minted"),
      ]);
      const entryFee = u256(feeR);
      const paymentTokenRaw = BigInt(tokenR[0] ?? "0");
      const maxSupply = u256(maxR);
      return {
        open: BigInt(openR[0] ?? "0") !== 0n,
        numMembers: Number(u256(mintedR)),
        maxMembers: maxSupply >= UNLIMITED ? null : Number(maxSupply),
        entryFee: entryFee > 0n ? entryFee.toString() : null,
        paymentToken:
          paymentTokenRaw > 0n ? normalizeAddress("STARKNET", "0x" + paymentTokenRaw.toString(16)) : null,
      };
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { info: data ?? null, isLoading, error, mutate };
}

/** Membership = holding a card: `balance_of(wallet) > 0` on the club contract. */
export function useClubMembership(clubAddress: string | null, wallet: string | null) {
  const key = clubAddress && wallet ? `club-membership-${clubAddress}-${wallet}` : null;

  const { data, error, isLoading, mutate } = useSWR<{ isMember: boolean }>(
    key,
    async () => {
      const res = await publicReadProvider.callContract({
        contractAddress: clubAddress!,
        entrypoint: "balance_of",
        calldata: [wallet!],
      });
      return { isMember: u256(res) > 0n };
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { isMember: data?.isMember ?? false, isLoading, error, mutate };
}
