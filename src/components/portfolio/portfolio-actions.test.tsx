import { afterEach, expect, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import type { ApiOrder } from "@medialane/sdk";
import { mockForThisFile } from "../../../test/mock-for-this-file";
import { createFakeMarketplaceTransaction } from "../../../test/fake-marketplace-transaction";

const { control, useFakeMarketplaceTransaction } = createFakeMarketplaceTransaction();
const fulfilled: unknown[] = [];

await mockForThisFile("@/hooks/use-marketplace-transaction", { useMarketplaceTransaction: useFakeMarketplaceTransaction as never });
await mockForThisFile("@/lib/marketplace-intents", {
  fulfillOrder: (async (_ctx: unknown, input: unknown) => {
    fulfilled.push(input);
    return { txHash: "0xtx", orderHash: null };
  }) as never,
});

const { useCounterOfferActions } = await import("./portfolio-actions");

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
