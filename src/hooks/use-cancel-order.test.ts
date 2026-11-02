import { afterAll, afterEach, beforeAll, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import type { ApiOrder } from "@medialane/sdk";
import { createFakeMarketplaceTransaction } from "../../test/fake-marketplace-transaction";

const real = {
  tx: { ...(await import("@/hooks/use-marketplace-transaction")) },
  intents: { ...(await import("@/lib/marketplace-intents")) },
};

// Module mocks outlive this file in bun, so every fake hands back to the real one once this file is done.
let active = false;
const { control, useFakeMarketplaceTransaction } = createFakeMarketplaceTransaction();
const cancelled: unknown[] = [];

mock.module("@/hooks/use-marketplace-transaction", () => ({
  ...real.tx,
  useMarketplaceTransaction: (...args: Parameters<typeof real.tx.useMarketplaceTransaction>) =>
    (active ? useFakeMarketplaceTransaction : real.tx.useMarketplaceTransaction)(...args),
}));
mock.module("@/lib/marketplace-intents", () => ({
  ...real.intents,
  cancelOrder: async (...args: Parameters<typeof real.intents.cancelOrder>) => {
    if (!active) return real.intents.cancelOrder(...args);
    cancelled.push(args[1]);
    return "0xtx";
  },
}));

const { useCancelOrder } = await import("./use-cancel-order");

beforeAll(() => { active = true; });
afterAll(() => { active = false; });
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
