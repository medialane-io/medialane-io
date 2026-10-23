import { test, expect, mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { renderHook, act } from "@testing-library/react";

if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register();

const WALLET_ADDRESS = "0xdeadbeef";
const executed: Array<{ calls: unknown; opts?: unknown }> = [];
const FULFILL_CALL = { contractAddress: "0xmkt", entrypoint: "fulfill_order", calldata: ["0xo"] };
const SWAP_CALL = { contractAddress: "0xavnu", entrypoint: "multi_route_swap", calldata: [] };

mock.module("./use-wallet-native-session", () => ({
  useWalletNativeSession: () => ({
    address: WALLET_ADDRESS,
    hasWallet: true,
    isDeployed: true,
    signer: {
      address: WALLET_ADDRESS,
      signTypedData: async () => ["0xr", "0xs"],
      execute: async (calls: unknown, opts?: unknown) => {
        executed.push({ calls, opts });
        return { txHash: "0xtx" };
      },
    },
  }),
}));

const realUi = await import("@medialane/ui");
mock.module("@medialane/ui", () => ({
  ...realUi,
  useMedialaneClient: () => ({
    api: {
      intents: {
        create: async (kind: string) =>
          kind === "listing"
            ? { id: "intent1", requiresSignature: true, typedData: { message: {} } }
            : { id: "fulfill1", requiresSignature: false, calls: [FULFILL_CALL] },
        submitSignature: async () => ({ calls: [{ contractAddress: "0x1", entrypoint: "approve", calldata: [] }] }),
        confirm: async () => ({}),
        get: async () => ({ status: "FAILED" }),
        syncTransaction: async () => ({ applied: 0, pending: false }),
      },
    },
  }),
}));

const { useMarketplace } = await import("./use-marketplace");

test("createListing rejects instead of silently resolving when the intent never confirms", async () => {
  const { result } = renderHook(() => useMarketplace());

  let thrown: unknown;
  await act(async () => {
    try {
      await result.current.createListing({
        assetContract: "0x1",
        tokenId: "1",
        price: "100",
        currencySymbol: "USDC",
        durationSeconds: 3600,
      });
    } catch (err) {
      thrown = err;
    }
  });

  expect(thrown).toBeInstanceOf(Error);
  expect(result.current.error).toBeTruthy();
});

async function fulfill(input: Record<string, unknown>) {
  executed.length = 0;
  const { result } = renderHook(() => useMarketplace());
  await act(async () => {
    try {
      await result.current.fulfillOrder({ orderHash: "0xo", tokenStandard: "ERC721", ...input } as never);
    } catch {}
  });
  return executed;
}

test("a purchase runs only the backend's fulfill intent, with no fee call added in the browser", async () => {
  expect(await fulfill({})).toEqual([{ calls: [FULFILL_CALL], opts: { intentIds: ["fulfill1"] } }]);
});

test("a purchase paid through a swap runs the swap intent first, in one transaction", async () => {
  expect(await fulfill({ swap: { id: "swap1", calls: [SWAP_CALL] } })).toEqual([
    { calls: [SWAP_CALL, FULFILL_CALL], opts: { intentIds: ["swap1", "fulfill1"] } },
  ]);
});
