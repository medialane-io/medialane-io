import { afterEach, describe, expect, test } from "bun:test";
import { UserFacingError } from "@medialane/ui";
import { SUPPORTED_TOKENS } from "@/lib/constants";
import {
  cancelOrder,
  createListing,
  fulfillOrder,
  makeCounterOffer,
  makeOffer,
  runMarketplaceIntent,
  transferNft,
  type MarketplaceContext,
} from "./marketplace-intents";

const ADDRESS = "0xdeadbeef";
const FULFILL_CALL = { contractAddress: "0xmkt", entrypoint: "fulfill_order", calldata: ["0xo"] };
const SWAP_CALL = { contractAddress: "0xavnu", entrypoint: "multi_route_swap", calldata: [] };
const APPROVE_CALL = { contractAddress: "0x1", entrypoint: "approve", calldata: [] };
const USDC = SUPPORTED_TOKENS.find((t) => t.symbol === "USDC")!.address;

type Intent = { id: string; requiresSignature: boolean; typedData?: unknown; calls?: unknown[] };

function fixture({
  intent,
  statuses = ["CONFIRMED"],
  txHash = "0xtx",
  orderHash = null,
}: { intent?: Intent; statuses?: string[]; txHash?: string; orderHash?: string | null } = {}) {
  const log = {
    created: [] as Array<{ kind: string; params: Record<string, unknown>; via: "client" | "api" }>,
    signed: [] as unknown[],
    submitted: [] as Array<{ id: string; sig: unknown }>,
    executed: [] as Array<{ calls: unknown; opts?: unknown }>,
    confirmed: [] as Array<{ id: string; hash: string }>,
    polls: 0,
  };
  const created = intent ?? { id: "fulfill1", requiresSignature: false, calls: [FULFILL_CALL] };
  const client = {
    createIntent: async (kind: string, params: Record<string, unknown>) => {
      log.created.push({ kind, params, via: "client" });
      return { expiresAt: "", ...created };
    },
    api: {
      intents: {
        create: async (kind: string, params: Record<string, unknown>) => {
          log.created.push({ kind, params, via: "api" });
          return { expiresAt: "", ...created };
        },
        submitSignature: async (id: string, sig: unknown) => {
          log.submitted.push({ id, sig });
          return { calls: [APPROVE_CALL] };
        },
        confirm: async (id: string, hash: string) => {
          log.confirmed.push({ id, hash });
          return {};
        },
        get: async () => {
          const status = statuses[Math.min(log.polls, statuses.length - 1)];
          log.polls++;
          return { status, orderHash };
        },
      },
    },
  };
  const signer = {
    address: ADDRESS,
    signTypedData: async (data: unknown) => {
      log.signed.push(data);
      return ["0xr", "0xs"];
    },
    execute: async (calls: unknown, opts?: unknown) => {
      log.executed.push({ calls, opts });
      return { txHash };
    },
  };
  const ctx = { client, signer } as unknown as MarketplaceContext;
  return { ctx, log };
}

const FAST = { pollIntervalMs: 0 };
const realNow = Date.now;
afterEach(() => {
  Date.now = realNow;
});

describe("runMarketplaceIntent", () => {
  test("a signed intent signs the sanitized typed data and executes the returned calls", async () => {
    const { ctx, log } = fixture({
      intent: { id: "intent1", requiresSignature: true, typedData: { message: { currency: "usdc" } } },
    });
    await runMarketplaceIntent(ctx, () => ctx.client.api.intents.create("listing", {} as never), FAST);
    expect(log.signed).toEqual([{ message: { currency: USDC } }]);
    expect(log.submitted).toEqual([{ id: "intent1", sig: ["0xr", "0xs"] }]);
    expect(log.executed).toEqual([{ calls: [APPROVE_CALL], opts: { intentIds: ["intent1"] } }]);
  });

  test("a locally built order is signed as built and executed with its own signed calls", async () => {
    const { buildIntent, populateSignedCalls } = await import("@medialane/sdk/starknet");
    const { resolveConfig } = await import("@medialane/sdk");
    const params = {
      offerer: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      nftContract: "0x0222222222222222222222222222222222222222222222222222222222222222",
      tokenId: "42",
      currency: USDC,
      price: "1.5",
      endTime: 1_900_000_000,
      salt: "0xabc",
      startTime: 1_800_000_000,
    };
    const built = buildIntent("listing", params, { counter: "5", royaltyMaxBps: "500" }, resolveConfig({}));
    const { ctx, log } = fixture({
      intent: { id: "intent1", requiresSignature: true, typedData: built.typedData, local: { kind: "listing", built } } as Intent,
    });
    await runMarketplaceIntent(ctx, () => ctx.client.createIntent("listing", params), FAST);
    expect(log.signed[0]).toBe(built.typedData);
    expect(log.executed[0]!.calls).toEqual(populateSignedCalls("listing", built, ["0xr", "0xs"]));
  });

  test("a prebuilt intent executes without signing", async () => {
    const { ctx, log } = fixture();
    await runMarketplaceIntent(ctx, () => ctx.client.api.intents.create("fulfill", {} as never), FAST);
    expect(log.signed).toEqual([]);
    expect(log.executed).toEqual([{ calls: [FULFILL_CALL], opts: { intentIds: ["fulfill1"] } }]);
  });

  test("a swap runs first in the same transaction", async () => {
    const { ctx, log } = fixture();
    await runMarketplaceIntent(ctx, () => ctx.client.api.intents.create("fulfill", {} as never), {
      ...FAST,
      before: { id: "swap1", calls: [SWAP_CALL] },
    });
    expect(log.executed).toEqual([{ calls: [SWAP_CALL, FULFILL_CALL], opts: { intentIds: ["swap1", "fulfill1"] } }]);
  });

  test("confirm receives the hash padded to 64 hex digits", async () => {
    const { ctx, log } = fixture({ txHash: "0xabc" });
    const { txHash } = await runMarketplaceIntent(ctx, () => ctx.client.api.intents.create("fulfill", {} as never), FAST);
    expect(txHash).toBe("0xabc");
    expect(log.confirmed).toEqual([{ id: "fulfill1", hash: "0x" + "abc".padStart(64, "0") }]);
  });

  test("returns the order hash the backend recorded for the intent", async () => {
    const { ctx } = fixture({ statuses: ["PENDING", "CONFIRMED"], orderHash: "0xorder" });
    const result = await runMarketplaceIntent(ctx, () => ctx.client.api.intents.create("listing", {} as never), FAST);
    expect(result).toEqual({ txHash: "0xtx", orderHash: "0xorder" });
  });

  test("the order hash is null when the backend recorded none", async () => {
    const { ctx } = fixture();
    const result = await runMarketplaceIntent(ctx, () => ctx.client.api.intents.create("listing", {} as never), FAST);
    expect(result.orderHash).toBeNull();
  });

  test("a FAILED intent throws a UserFacingError", async () => {
    const { ctx } = fixture({ statuses: ["PENDING", "FAILED"] });
    await expect(
      runMarketplaceIntent(ctx, () => ctx.client.api.intents.create("fulfill", {} as never), FAST),
    ).rejects.toBeInstanceOf(UserFacingError);
  });

  test("polling gives up after 10 attempts", async () => {
    const { ctx, log } = fixture({ statuses: ["PENDING"] });
    await expect(
      runMarketplaceIntent(ctx, () => ctx.client.api.intents.create("fulfill", {} as never), FAST),
    ).rejects.toThrow("Verification timed out");
    expect(log.polls).toBe(10);
  });
});

describe("marketplace actions", () => {
  test("createListing sends signer.address as offerer and amount only for ERC1155", async () => {
    Date.now = () => 1_700_000_000_000;
    const { ctx, log } = fixture();
    const base = { assetContract: "0xc", tokenId: "7", price: "5", currencySymbol: "USDC", durationSeconds: 3600 };
    await createListing(ctx, { ...base, tokenStandard: "ERC721" }, FAST);
    await createListing(ctx, { ...base, tokenStandard: "ERC1155", amount: "3" }, FAST);
    expect(log.created[0]).toEqual({
      kind: "listing",
      params: { offerer: ADDRESS, nftContract: "0xc", tokenId: "7", currency: USDC, price: "5", endTime: 1_700_003_600 },
      via: "client",
    });
    expect(log.created[1].params.amount).toBe("3");
  });

  test("makeOffer sends quantity 1 for ERC1155 when none is given, none for ERC721", async () => {
    const { ctx, log } = fixture();
    const base = { assetContract: "0xc", tokenId: "7", price: "5", currencySymbol: "USDC", durationSeconds: 60 };
    await makeOffer(ctx, { ...base, tokenStandard: "ERC1155" }, FAST);
    await makeOffer(ctx, { ...base, tokenStandard: "ERC721", quantity: "4" }, FAST);
    expect(log.created[0].params).toMatchObject({ offerer: ADDRESS, tokenStandard: "ERC1155", quantity: "1" });
    expect(log.created[1].params.quantity).toBeUndefined();
  });

  test("fulfill, cancel and counter-offer send the signer's address", async () => {
    const { ctx, log } = fixture();
    await fulfillOrder(ctx, { orderHash: "0xo", tokenStandard: "ERC1155", quantity: "2" }, FAST);
    await cancelOrder(ctx, { orderHash: "0xo", tokenStandard: "ERC20" }, FAST);
    await makeCounterOffer(ctx, { originalOrderHash: "0xo", counterPriceRaw: "9", durationSeconds: 60, message: "hi" }, FAST);
    expect(log.created.map((c) => c.kind)).toEqual(["fulfill", "cancel", "counter-offer"]);
    expect(log.created[0].params).toEqual({ fulfiller: ADDRESS, orderHash: "0xo", tokenStandard: "ERC1155", quantity: "2" });
    expect(log.created[1].params).toEqual({ offerer: ADDRESS, orderHash: "0xo", tokenStandard: undefined });
    expect(log.created[2].params).toEqual({
      sellerAddress: ADDRESS,
      originalOrderHash: "0xo",
      durationSeconds: 60,
      priceRaw: "9",
      message: "hi",
    });
  });

  test("listing, offer, cancel and counter-offer are built by the client; fulfill is created by the API", async () => {
    const { ctx, log } = fixture();
    const base = { assetContract: "0xc", tokenId: "7", price: "5", currencySymbol: "USDC", durationSeconds: 60 };
    await createListing(ctx, { ...base, tokenStandard: "ERC721" }, FAST);
    await makeOffer(ctx, { ...base, tokenStandard: "ERC721" }, FAST);
    await cancelOrder(ctx, { orderHash: "0xo" }, FAST);
    await makeCounterOffer(ctx, { originalOrderHash: "0xo", counterPriceRaw: "9", durationSeconds: 60 }, FAST);
    await fulfillOrder(ctx, { orderHash: "0xo" }, FAST);
    expect(log.created.map((c) => `${c.kind}:${c.via}`)).toEqual([
      "listing:client",
      "offer:client",
      "cancel:client",
      "counter-offer:client",
      "fulfill:api",
    ]);
  });

  test("an unknown currency symbol throws", async () => {
    const { ctx } = fixture();
    await expect(
      createListing(ctx, { assetContract: "0xc", tokenId: "1", price: "1", currencySymbol: "XYZ", durationSeconds: 60 }, FAST),
    ).rejects.toThrow("Unsupported currency: XYZ");
  });
});

describe("transferNft", () => {
  const transfer = { contractAddress: "0x1", tokenId: "1", toAddress: "0x2", tokenStandard: "ERC721" as const };

  test("runs the backend's transfer intent from the signer's address", async () => {
    const { ctx, log } = fixture({ intent: { id: "nft-intent", requiresSignature: false, calls: [FULFILL_CALL] } });
    const txHash = await transferNft(ctx, { ...transfer, tokenStandard: "ERC1155" });
    expect(txHash).toBe("0xtx");
    expect(log.created).toEqual([{
      kind: "transfer-nft",
      params: { owner: ADDRESS, contractAddress: "0x1", tokenId: "1", recipient: "0x2", tokenStandard: "ERC1155" },
      via: "api",
    }]);
    expect(log.executed).toEqual([{ calls: [FULFILL_CALL], opts: { intentIds: ["nft-intent"] } }]);
    expect(log.polls).toBe(0);
  });

  test("a token of unknown standard is transferred as ERC-721", async () => {
    const { ctx, log } = fixture();
    await transferNft(ctx, { ...transfer, tokenStandard: "UNKNOWN" });
    expect(log.created[0].params.tokenStandard).toBe("ERC721");
  });

  test("an invalid recipient or contract is refused before anything is sent", async () => {
    const { ctx, log } = fixture();
    await expect(transferNft(ctx, { ...transfer, toAddress: "0x" })).rejects.toThrow("Invalid recipient address.");
    await expect(transferNft(ctx, { ...transfer, contractAddress: "nope" })).rejects.toThrow("Invalid token contract address.");
    expect(log.created).toEqual([]);
  });

  test("a token without a known standard is refused", async () => {
    const { ctx } = fixture();
    await expect(transferNft(ctx, { ...transfer, tokenStandard: undefined })).rejects.toThrow("Token standard could not be determined");
  });
});
