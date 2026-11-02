import { afterEach, expect, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import type { ApiOrder } from "@medialane/sdk";
import { mockForThisFile } from "../../test/mock-for-this-file";
import { createFakeMarketplaceTransaction } from "../../test/fake-marketplace-transaction";

const { control, useFakeMarketplaceTransaction } = createFakeMarketplaceTransaction();
const fulfilled: unknown[] = [];

await mockForThisFile("@/hooks/use-marketplace-transaction", { useMarketplaceTransaction: useFakeMarketplaceTransaction as never });
await mockForThisFile("@/lib/marketplace-intents", {
  fulfillOrder: (async (_ctx: unknown, input: unknown) => {
    fulfilled.push(input);
    return { txHash: "0xtx", orderHash: null };
  }) as never,
});
await mockForThisFile("@medialane/ui/utils/media-wallet/use-erc20-balance", {
  useTokenBalance: () => ({ rawBalance: null, decimals: 6, isLoading: false }) as never,
});

const { useAcceptOffer } = await import("./use-accept-offer");

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
