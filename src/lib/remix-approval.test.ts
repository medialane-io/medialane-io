import { describe, expect, test } from "bun:test";
import { hash } from "starknet";
import type { RemixOffer } from "@/types/remix-offers";
import type { MarketplaceContext } from "./marketplace-intents";
import { approveRemix, type RemixCollection } from "./remix-approval";

const OWNER = "0xa11ce";
const COLLECTION_721: RemixCollection = { contractAddress: "0xc721", collectionId: "7", standard: "ERC721" };
const COLLECTION_1155: RemixCollection = { contractAddress: "0xc1155", collectionId: null, standard: "ERC1155" };
const TRANSFER = hash.getSelectorFromName("Transfer");

const OFFER = {
  id: "offer1",
  originalContract: "0xparent",
  originalTokenId: "3",
  licenseType: "CC-BY",
  commercial: true,
  derivatives: true,
  royaltyPct: 5,
  price: { raw: "5000000", formatted: "5", currency: "USDC", decimals: 6 },
} as unknown as RemixOffer;

/** A backend + chain fake: the mint receipt carries a Transfer from 0 for `mintedId`. */
function fixture({
  mintedId = "42",
  orderHash = "0xorder" as string | null,
  orders = [] as unknown[],
  receiptFrom = undefined as string | undefined,
} = {}) {
  const log = {
    uploads: [] as unknown[],
    created: [] as Array<{ kind: string; params: Record<string, unknown> }>,
    executed: [] as Array<{ calls: unknown; opts: unknown }>,
    confirmedOffers: [] as Array<{ id: string; body: unknown }>,
  };
  const contractOf = (params: Record<string, unknown>) =>
    (params.collectionContract as string) ?? COLLECTION_721.contractAddress;
  let mintContract = "";
  const createIntent = async (kind: string, params: Record<string, unknown>) => {
    log.created.push({ kind, params });
    if (kind === "mint") mintContract = receiptFrom ?? contractOf(params);
    return { id: `${kind}1`, expiresAt: "", requiresSignature: false, calls: [{ contractAddress: "0x1", entrypoint: kind, calldata: [] }] };
  };
  const client = {
    createIntent,
    provider: {
      getTransactionReceipt: async (txHash: string) => ({
        execution_status: "SUCCEEDED",
        events: txHash === "0xmint"
          ? [{ from_address: mintContract, keys: [TRANSFER, "0x0", OWNER, mintedId, "0x0"], data: [] }]
          : [],
      }),
    },
    api: {
      metadata: {
        upload: async (payload: unknown) => {
          log.uploads.push(payload);
          return { data: { url: "ipfs://meta" } };
        },
      },
      intents: {
        create: createIntent,
        confirm: async () => ({}),
        get: async () => ({ status: "CONFIRMED", orderHash }),
        syncTransaction: async () => ({ applied: 1, pending: false }),
      },
      orders: { forToken: async () => ({ data: orders }) },
      remix: {
        confirm: async (id: string, body: unknown) => {
          log.confirmedOffers.push({ id, body });
          return {};
        },
      },
    },
  };
  const signer = {
    address: OWNER,
    signTypedData: async () => ["0xr", "0xs"],
    execute: async (calls: unknown, opts: unknown) => {
      log.executed.push({ calls, opts });
      return { txHash: log.executed.length === 1 ? "0xmint" : "0xlist" };
    },
  };
  return { ctx: { client, signer } as unknown as MarketplaceContext, log };
}

const FAST = { pollIntervalMs: 0, listingWaitMs: 0 };

describe("approveRemix", () => {
  test("an ERC-721 remix lists the token id read from the mint receipt", async () => {
    const { ctx, log } = fixture({ mintedId: "42" });
    const result = await approveRemix(ctx, { offer: OFFER, collection: COLLECTION_721, name: "My remix" }, FAST);
    expect(result).toEqual({ contract: "0xc721", tokenId: "42" });
    expect(log.created[0]).toEqual({
      kind: "mint",
      params: { owner: OWNER, collectionId: "7", recipient: OWNER, tokenUri: "ipfs://meta", royaltyBps: 0 },
    });
    expect(log.created[1].params).toMatchObject({ nftContract: "0xc721", tokenId: "42" });
  });

  test("an ERC-1155 remix mints one edition and lists one", async () => {
    const { ctx, log } = fixture({ mintedId: "9" });
    const result = await approveRemix(ctx, { offer: OFFER, collection: COLLECTION_1155, name: "My remix" }, FAST);
    expect(result).toEqual({ contract: "0xc1155", tokenId: "9" });
    expect(log.created[0].params).toEqual({
      owner: OWNER, recipient: OWNER, collectionContract: "0xc1155", tokenUri: "ipfs://meta", value: "1",
    });
    expect(log.created[1].params).toMatchObject({ tokenId: "9", amount: "1" });
  });

  test("the listing price is the offer's amount in token units, not its raw value", async () => {
    const { ctx, log } = fixture();
    await approveRemix(ctx, { offer: OFFER, collection: COLLECTION_721, name: "My remix" }, FAST);
    expect(log.created[1].params.price).toBe("5");
  });

  test("the offer is confirmed with the order the listing created", async () => {
    const { ctx, log } = fixture({ mintedId: "42", orderHash: "0xorder" });
    await approveRemix(ctx, { offer: OFFER, collection: COLLECTION_721, name: "My remix" }, FAST);
    expect(log.confirmedOffers).toEqual([{
      id: "offer1",
      body: { remixContract: "0xc721", remixTokenId: "42", approvedCollection: "0xc721", orderHash: "0xorder" },
    }]);
  });

  test("without a recorded order hash, the active listing for the token is used", async () => {
    const { ctx, log } = fixture({
      orderHash: null,
      orders: [
        { orderHash: "0xold", status: "CANCELLED", offer: { itemType: "ERC721" } },
        { orderHash: "0xactive", status: "ACTIVE", offer: { itemType: "ERC721" } },
      ],
    });
    await approveRemix(ctx, { offer: OFFER, collection: COLLECTION_721, name: "My remix" }, FAST);
    expect((log.confirmedOffers[0].body as { orderHash: string }).orderHash).toBe("0xactive");
  });

  test("a mint receipt without a minted token id stops before listing", async () => {
    const { ctx, log } = fixture({ receiptFrom: "0xsomeothercontract" });
    await expect(
      approveRemix(ctx, { offer: OFFER, collection: COLLECTION_721, name: "My remix" }, FAST),
    ).rejects.toThrow("could not read the assigned token id");
    expect(log.created.map((c) => c.kind)).toEqual(["mint"]);
  });

  test("the metadata records the parent token and license terms", async () => {
    const { ctx, log } = fixture();
    await approveRemix(ctx, { offer: OFFER, collection: COLLECTION_721, name: "My remix" }, FAST);
    expect(log.uploads[0]).toMatchObject({
      name: "My remix",
      description: "Remix of Token #3",
      attributes: expect.arrayContaining([
        { trait_type: "Parent Contract", value: "0xparent" },
        { trait_type: "Royalty", value: "5%" },
        { trait_type: "Creator", value: OWNER },
      ]),
    });
  });
});
