import { afterAll, afterEach, beforeAll, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import type { ApiOrder } from "@medialane/sdk";
import { createFakeMarketplaceTransaction } from "../../../test/fake-marketplace-transaction";

const real = {
  tx: { ...(await import("@/hooks/use-marketplace-transaction")) },
  intents: { ...(await import("@/lib/marketplace-intents")) },
};

// Module mocks outlive this file in bun, so every fake hands back to the real one once this file is done.
let active = false;
const { control, useFakeMarketplaceTransaction } = createFakeMarketplaceTransaction();
const fulfilled: unknown[] = [];

mock.module("@/hooks/use-marketplace-transaction", () => ({
  ...real.tx,
  useMarketplaceTransaction: (...args: Parameters<typeof real.tx.useMarketplaceTransaction>) =>
    (active ? useFakeMarketplaceTransaction : real.tx.useMarketplaceTransaction)(...args),
}));
mock.module("@/lib/marketplace-intents", () => ({
  ...real.intents,
  fulfillOrder: async (...args: Parameters<typeof real.intents.fulfillOrder>) => {
    if (!active) return real.intents.fulfillOrder(...args);
    fulfilled.push(args[1]);
    return "0xtx";
  },
}));

const { useCounterOfferActions } = await import("./portfolio-actions");

beforeAll(() => { active = true; });
afterAll(() => { active = false; });
afterEach(() => {
  control.clear();
  fulfilled.length = 0;
});

const COUNTER = {
  orderHash: "0xcounter",
  offer: { itemType: "ERC20" },
  consideration: { itemType: "ERC721" },
} as unknown as ApiOrder;

test("useCounterOfferActions: isProcessing follows the transaction", async () => {
  control.hang = true;
  const { result } = renderHook(() => useCounterOfferActions({ refresh: () => {} }));
  expect(result.current.isProcessing).toBe(false);
  await act(async () => { result.current.accept?.(COUNTER); });
  expect(result.current.isProcessing).toBe(true);
});

test("useCounterOfferActions: accepting fulfills the counter-offer and refreshes", async () => {
  control.runWork = true;
  let refreshed = 0;
  const { result } = renderHook(() => useCounterOfferActions({ refresh: () => { refreshed++; } }));
  await act(async () => { result.current.accept?.(COUNTER); });
  expect(fulfilled).toEqual([{ orderHash: "0xcounter", tokenStandard: "ERC721" }]);
  expect(refreshed).toBe(1);
});
