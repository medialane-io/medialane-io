import { expect, test } from "bun:test";
import { swapQuoteKey } from "./use-swap-quote";

test("no quote is requested while signed out", () => {
  expect(swapQuoteKey(null, "USDC", "STRK", "1", "sell", null)).toBeNull();
  expect(swapQuoteKey({ accountId: "a" } as never, "USDC", "STRK", "1", "sell", null)).not.toBeNull();
});
