import { afterEach, expect, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import type { ApiOrder } from "@medialane/sdk";
import { mockForThisFile } from "../../test/mock-for-this-file";
import { createFakeMarketplaceTransaction } from "../../test/fake-marketplace-transaction";

const { control, useFakeMarketplaceTransaction } = createFakeMarketplaceTransaction();
const cancelled: unknown[] = [];

await mockForThisFile("@/hooks/use-marketplace-transaction", { useMarketplaceTransaction: useFakeMarketplaceTransaction as never });
await mockForThisFile("@/lib/marketplace-intents", {
  cancelOrder: (async (_ctx: unknown, input: unknown) => {
    cancelled.push(input);
    return { txHash: "0xtx", orderHash: null };
  }) as never,
});

const { useCancelOrder } = await import("./use-cancel-order");

afterEach(() => {
  control.clear();
  cancelled.length = 0;
});

const OFFER = { orderHash: "0xoffer", offer: { itemType: "ERC20" }, consideration: { itemType: "ERC1155" } } as unknown as ApiOrder;
const LISTING = { orderHash: "0xlisting", offer: { itemType: "ERC721" }, consideration: { itemType: "ERC20" } } as unknown as ApiOrder;

test("cancelling an offer sends the NFT standard, not ERC20", async () => {
  control.runWork = true;
  const { result } = renderHook(() => useCancelOrder({}));
  act(() => result.current.select(OFFER));
  expect(result.current.order).toBe(OFFER);
  await act(async () => { result.current.confirm(); });
  expect(cancelled).toEqual([{ orderHash: "0xoffer", tokenStandard: "ERC1155" }]);
});

test("a tokenStandard option overrides the order's", async () => {
  control.runWork = true;
  const { result } = renderHook(() => useCancelOrder({ tokenStandard: "ERC1155" }));
  act(() => result.current.select(LISTING));
  await act(async () => { result.current.confirm(); });
  expect(cancelled).toEqual([{ orderHash: "0xlisting", tokenStandard: "ERC1155" }]);
});

test("onSuccess runs after a successful cancel only", async () => {
  let successes = 0;
  const { result } = renderHook(() => useCancelOrder({ onSuccess: () => { successes++; } }));
  act(() => result.current.select(LISTING));
  control.fail = { message: "no", retryable: true };
  await act(async () => { result.current.confirm(); });
  expect(successes).toBe(0);
  expect(result.current.phase).toBe("error");
  control.fail = null;
  await act(async () => { result.current.confirm(); });
  expect(successes).toBe(1);
});

test("dismiss is ignored while busy", async () => {
  control.hang = true;
  const { result } = renderHook(() => useCancelOrder({}));
  act(() => result.current.select(LISTING));
  await act(async () => { result.current.confirm(); });
  expect(result.current.busy).toBe(true);
  act(() => result.current.dismiss());
  expect(result.current.order).toBe(LISTING);
});

test("dismiss clears the order when idle", () => {
  const { result } = renderHook(() => useCancelOrder({}));
  act(() => result.current.select(LISTING));
  act(() => result.current.dismiss());
  expect(result.current.order).toBeNull();
});
