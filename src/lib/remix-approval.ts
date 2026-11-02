import { formatAmount } from "@medialane/sdk";
import { executeIntent, mintedTokenIdFromReceipt } from "@medialane/sdk/starknet";
import { uploadJsonToIpfs } from "@medialane/ui";
import type { RemixOffer } from "@/types/remix-offers";
import { createListing, type MarketplaceContext } from "./marketplace-intents";

export interface RemixCollection {
  contractAddress: string;
  /** Registry id; required for ERC-721 collections, which mint through the registry. */
  collectionId: string | null;
  standard: "ERC721" | "ERC1155";
}

export interface RemixApprovalInput {
  offer: RemixOffer;
  collection: RemixCollection;
  name: string;
}

interface ApprovalOptions {
  pollIntervalMs?: number;
  /** How long to look for the listing when the backend recorded no order hash. */
  listingWaitMs?: number;
}

const LISTING_DURATION_SECONDS = 30 * 24 * 60 * 60;
const LISTING_LOOKUP_INTERVAL_MS = 2000;
const LISTING_LOOKUP_WAIT_MS = 15_000;

function remixMetadata(offer: RemixOffer, name: string, creator: string) {
  return {
    name,
    description: `Remix of Token #${offer.originalTokenId}`,
    image: "",
    attributes: [
      { trait_type: "Parent Contract", value: offer.originalContract },
      { trait_type: "Parent Token ID", value: offer.originalTokenId },
      { trait_type: "Remix Type", value: "Derivative" },
      { trait_type: "License", value: offer.licenseType },
      { trait_type: "Commercial Use", value: offer.commercial ? "Yes" : "No" },
      { trait_type: "Derivatives", value: offer.derivatives ? "Yes" : "No" },
      ...(offer.royaltyPct != null ? [{ trait_type: "Royalty", value: `${offer.royaltyPct}%` }] : []),
      { trait_type: "Creator", value: creator },
    ],
  };
}

async function findActiveListing(
  { client }: MarketplaceContext,
  { contractAddress, standard }: RemixCollection,
  tokenId: string,
  waitMs: number,
): Promise<string | null> {
  const deadline = Date.now() + waitMs;
  for (;;) {
    try {
      const { data } = await client.api.orders.forToken(contractAddress, tokenId);
      const listing = data?.find((o) => o.status === "ACTIVE" && o.offer.itemType === standard);
      if (listing) return listing.orderHash;
    } catch {
      // The indexer may not have the order yet; look again until the deadline.
    }
    if (Date.now() + LISTING_LOOKUP_INTERVAL_MS > deadline) return null;
    await new Promise((r) => setTimeout(r, LISTING_LOOKUP_INTERVAL_MS));
  }
}

/**
 * Grants a remix request: mints the derivative into `collection`, lists it at the offered price and
 * records the listing on the offer. Returns the minted token.
 */
export async function approveRemix(
  ctx: MarketplaceContext,
  { offer, collection, name }: RemixApprovalInput,
  { pollIntervalMs, listingWaitMs = LISTING_LOOKUP_WAIT_MS }: ApprovalOptions = {},
): Promise<{ contract: string; tokenId: string }> {
  const { client, signer } = ctx;
  const owner = signer.address;
  const is1155 = collection.standard === "ERC1155";

  const tokenUri = await uploadJsonToIpfs(client.api, remixMetadata(offer, name, owner));
  const mintIntent = await client.api.intents.create("mint", is1155
    ? { owner, recipient: owner, collectionContract: collection.contractAddress, tokenUri, value: "1" }
    : { owner, collectionId: collection.collectionId!, recipient: owner, tokenUri, royaltyBps: 0 });
  const { receipt } = await executeIntent(signer, client, mintIntent, { confirm: false });
  const tokenId = mintedTokenIdFromReceipt(receipt, collection.contractAddress);
  if (!tokenId) throw new Error("Minted, but could not read the assigned token id from the receipt");

  const listing = await createListing(ctx, {
    assetContract: collection.contractAddress,
    tokenId,
    price: offer.price ? formatAmount(offer.price.raw, offer.price.decimals) : "0",
    currencySymbol: offer.price?.currency ?? "STRK",
    durationSeconds: LISTING_DURATION_SECONDS,
    tokenStandard: is1155 ? "ERC1155" : undefined,
    amount: is1155 ? "1" : undefined,
  }, { pollIntervalMs });

  const orderHash = listing.orderHash ?? await findActiveListing(ctx, collection, tokenId, listingWaitMs);
  if (!orderHash) throw new Error("Could not confirm listing orderHash — check portfolio shortly");

  await client.api.remix.confirm(offer.id, {
    remixContract: collection.contractAddress,
    remixTokenId: tokenId,
    approvedCollection: collection.contractAddress,
    orderHash,
  });
  return { contract: collection.contractAddress, tokenId };
}
