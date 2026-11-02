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
  type MarketplaceContext,
} from "./marketplace-intents";

const ADDRESS = "0xdeadbeef";
const FULFILL_CALL = { contractAddress: "0xmkt", entrypoint: "fulfill_order", calldata: ["0xo"] };
const SWAP_CALL = { contractAddress: "0xavnu", entrypoint: "multi_route_swap", calldata: [] };
const APPROVE_CALL = { contractAddress: "0x1", entrypoint: "approve", calldata: [] };
const USDC = SUPPORTED_TOKENS.find((t) => t.symbol === "USDC")!.address;

type Intent = { id: string; requiresSignature: boolean; typedData?: unknown; calls?: unknown[] };

function fixture({ intent, statuses = ["CONFIRMED"], txHash = "0xtx" }: { intent?: Intent; statuses?: string[]; txHash?: string } = {}) {
  const log = {
    created: [] as Array<{ kind: string; params: Record<string, unknown> }>,
    signed: [] as unknown[],
    submitted: [] as Array<{ id: string; sig: unknown }>,
    executed: [] as Array<{ calls: unknown; opts?: unknown }>,
    confirmed: [] as Array<{ id: string; hash: string }>,
    polls: 0,
  };
  const created = intent ?? { id: "fulfill1", requiresSignature: false, calls: [FULFILL_CALL] };
  const client = {
    api: {
      intents: {
        create: async (kind: string, params: Record<string, unknown>) => {
          log.created.push({ kind, params });
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
          return { status };
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
    const hash = await runMarketplaceIntent(ctx, () => ctx.client.api.intents.create("fulfill", {} as never), FAST);
    expect(hash).toBe("0xabc");
    expect(log.confirmed).toEqual([{ id: "fulfill1", hash: "0x" + "abc".padStart(64, "0") }]);
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

  test("an unknown currency symbol throws", async () => {
    const { ctx } = fixture();
    await expect(
      createListing(ctx, { assetContract: "0xc", tokenId: "1", price: "1", currencySymbol: "XYZ", durationSeconds: 60 }, FAST),
    ).rejects.toThrow("Unsupported currency: XYZ");
  });
});
