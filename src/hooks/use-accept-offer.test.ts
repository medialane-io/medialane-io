import { afterAll, afterEach, beforeAll, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import type { ApiOrder } from "@medialane/sdk";
import { createFakeMarketplaceTransaction } from "../../test/fake-marketplace-transaction";

const real = {
  tx: { ...(await import("@/hooks/use-marketplace-transaction")) },
  intents: { ...(await import("@/lib/marketplace-intents")) },
  balance: { ...(await import("@medialane/ui/utils/media-wallet/use-erc20-balance")) },
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
mock.module("@medialane/ui/utils/media-wallet/use-erc20-balance", () => ({
  ...real.balance,
  useTokenBalance: (...args: Parameters<typeof real.balance.useTokenBalance>) =>
    active ? { rawBalance: null, decimals: 6, isLoading: false } : real.balance.useTokenBalance(...args),
}));

const { useAcceptOffer } = await import("./use-accept-offer");

beforeAll(() => { active = true; });
afterAll(() => { active = false; });
afterEach(() => {
  control.clear();
  fulfilled.length = 0;
});

const BID = {
  orderHash: "0xbid",
  offerer: "0xbuyer",
  offer: { itemType: "ERC20" },
  consideration: { itemType: "ERC1155" },
  price: { currency: "USDC", formatted: "5" },
} as unknown as ApiOrder;

test("confirmAccept starts one fulfill with the order's NFT standard", async () => {
  control.runWork = true;
  let refreshed = 0;
  const { result } = renderHook(() => useAcceptOffer({ mutateListings: () => { refreshed++; } }));
  act(() => result.current.handleAcceptClick(BID));
  await act(async () => { result.current.confirmAccept(); });
  expect(control.started).toBe(1);
  expect(fulfilled).toEqual([{ orderHash: "0xbid", tokenStandard: "ERC1155" }]);
  expect(result.current.phase).toBe("success");
  expect(refreshed).toBe(1);
});

test("with active listings the warning shows first, and proceeding starts the fulfill", async () => {
  control.runWork = true;
  const { result } = renderHook(() =>
    useAcceptOffer({ mutateListings: () => {}, activeListings: [{ orderHash: "0xlisting" } as ApiOrder] }),
  );
  act(() => result.current.handleAcceptClick(BID));
  expect(result.current.warningOpen).toBe(true);
  expect(control.started).toBe(0);
  await act(async () => { result.current.proceedFromWarning(); });
  expect(control.started).toBe(1);
  expect(fulfilled).toHaveLength(1);
});

test("busy follows the transaction and blocks dismiss", async () => {
  control.hang = true;
  const { result } = renderHook(() => useAcceptOffer({ mutateListings: () => {} }));
  act(() => result.current.handleAcceptClick(BID));
  await act(async () => { result.current.confirmAccept(); });
  expect(result.current.busy).toBe(true);
  act(() => result.current.dismiss());
  expect(result.current.isOpen).toBe(true);
});
