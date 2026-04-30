"use client";

import { useState } from "react";
import { normalizeAddress } from "@/lib/utils";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import type { ListingStep } from "@/components/marketplace/mint-progress-dialog";
import type { ApiToken } from "@medialane/sdk";

interface RunParams {
  walletAddress: string;
  collectionContract: string;
  price: string;
  currencySymbol: string;
  durationSeconds: number;
  tokenName: string;
  pin: string;
  tokenStandard?: string;
}

const POLL_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 4000;
const POLL_FIRST_WAIT_MS = 8000; // indexer cycle is ~6s — no point polling before that

export function usePostMintListing() {
  const client = useMedialaneClient();
  const { createListing } = useMarketplace();
  const [listingStep, setListingStep] = useState<ListingStep>("idle");
  const [listingError, setListingError] = useState<string | null>(null);

  async function run({
    walletAddress,
    collectionContract,
    price,
    currencySymbol,
    durationSeconds,
    tokenName,
    pin,
    tokenStandard,
  }: RunParams) {
    setListingStep("polling");
    try {
      const normContract = normalizeAddress(collectionContract);

      // Snapshot existing token IDs before polling so we can detect the new one
      const snapshot = new Set<string>();
      try {
        const existing = await client.api.getTokensByOwner(walletAddress, 1, 100);
        (existing.data as ApiToken[] ?? []).forEach((t) => {
          if (normalizeAddress(t.contractAddress) === normContract) snapshot.add(t.tokenId);
        });
      } catch { /* snapshot errors are non-fatal */ }

      // Poll until the indexer surfaces the newly minted token (max ~88s).
      // First wait is longer — indexer cycle is ~6s and IPFS metadata fetch adds more time.
      let newToken: { contractAddress: string; tokenId: string } | null = null;
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
        await new Promise((r) => setTimeout(r, attempt === 0 ? POLL_FIRST_WAIT_MS : POLL_INTERVAL_MS));
        try {
          const res = await client.api.getTokensByOwner(walletAddress, 1, 100);
          const found = (res.data as ApiToken[] ?? []).find(
            (t) => normalizeAddress(t.contractAddress) === normContract && !snapshot.has(t.tokenId)
          );
          if (found) {
            newToken = { contractAddress: found.contractAddress, tokenId: found.tokenId };
            break;
          }
        } catch { /* retry on transient errors */ }
      }

      if (newToken) {
        setListingStep("listing");
        await createListing({
          pin,
          assetContract: newToken.contractAddress,
          tokenId: newToken.tokenId,
          price,
          currencySymbol,
          durationSeconds,
          tokenName,
          tokenStandard: tokenStandard as "ERC721" | "ERC1155" | "UNKNOWN" | undefined,
        });
        setListingStep("listed");
      } else {
        setListingStep("failed");
        setListingError("Asset not indexed yet — go to Portfolio → Assets to list it");
      }
    } catch (err: unknown) {
      setListingStep("failed");
      setListingError(err instanceof Error ? err.message : "Listing failed");
    }
  }

  function reset() {
    setListingStep("idle");
    setListingError(null);
  }

  return { listingStep, listingError, runPostMintListing: run, resetListing: reset };
}
