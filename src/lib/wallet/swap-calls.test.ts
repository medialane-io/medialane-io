import { test, expect } from "bun:test";
import { getTokenBySymbol } from "@medialane/sdk";
import { createSwapIntent } from "./swap-calls";

test("symbols resolve to token addresses and the amount goes on the chosen side", async () => {
  const seen: unknown[] = [];
  const api = {
    intents: {
      create: async (_kind: unknown, params: unknown) => {
        seen.push(params);
        return { id: "swap1", requiresSignature: false as const, calls: [], expiresAt: "" };
      },
    },
  };
  const intent = await createSwapIntent(api as never, { sell: "STRK", buy: { address: "0xc0" }, takerAddress: "0xme", amountRaw: "5", amountMode: "sell" });
  expect(intent).toEqual({ id: "swap1", calls: [] });
  expect(seen).toEqual([{ taker: "0xme", sellTokenAddress: getTokenBySymbol("STRK")!.address, buyTokenAddress: "0xc0", sellAmountRaw: "5" }]);
});

test("an unknown symbol is refused before calling the backend", async () => {
  const api = { intents: { create: async () => { throw new Error("should not be called"); } } };
  await expect(createSwapIntent(api as never, { sell: "NOPE", buy: "USDC", takerAddress: "0xme", amountRaw: "1" })).rejects.toThrow("NOPE");
});
