import { test, expect } from "bun:test";
import { getTokenBySymbol } from "@medialane/sdk";
import { createSwapIntent } from "./swap-calls";

test("a swap is created by the client, with symbols resolved and the amount on the chosen side", async () => {
  const seen: unknown[] = [];
  const client = {
    createIntent: async (kind: unknown, params: unknown) => {
      seen.push({ kind, params });
      return { id: "swap1", requiresSignature: false as const, calls: [], expiresAt: "" };
    },
  };
  const intent = await createSwapIntent(client as never, { sell: "STRK", buy: { address: "0xc0" }, takerAddress: "0xme", amountRaw: "5", amountMode: "sell" });
  expect(intent).toEqual({ id: "swap1", calls: [] });
  expect(seen).toEqual([{ kind: "swap", params: { taker: "0xme", sellTokenAddress: getTokenBySymbol("STRK")!.address, buyTokenAddress: "0xc0", sellAmountRaw: "5" } }]);
});

test("an unknown symbol is refused before calling the backend", async () => {
  const client = { createIntent: async () => { throw new Error("should not be called"); } };
  await expect(createSwapIntent(client as never, { sell: "NOPE", buy: "USDC", takerAddress: "0xme", amountRaw: "1" })).rejects.toThrow("NOPE");
});
