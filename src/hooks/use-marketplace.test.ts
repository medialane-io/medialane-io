import { test, expect, mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { renderHook, act } from "@testing-library/react";

if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register();

const WALLET_ADDRESS = "0xdeadbeef";

mock.module("./use-wallet-native-session", () => ({
  useWalletNativeSession: () => ({
    address: WALLET_ADDRESS,
    hasWallet: true,
    isDeployed: true,
    signer: {
      address: WALLET_ADDRESS,
      signTypedData: async () => ["0xr", "0xs"],
      execute: async () => ({ txHash: "0xtx" }),
    },
  }),
}));

mock.module("./use-medialane-client", () => ({
  useMedialaneClient: () => ({
    api: {
      createListingIntent: async () => ({
        data: { id: "intent1", requiresSignature: true, typedData: { message: {} } },
      }),
      submitIntentSignature: async () => ({ data: { calls: [{ contractAddress: "0x1", entrypoint: "approve", calldata: [] }] } }),
      confirmIntent: async () => ({}),
      // Every poll finds the intent still FAILED — the exact real-world shape
      // of a listing that was signed and submitted but never confirmed.
      getIntent: async () => ({ data: { status: "FAILED" } }),
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

  // The regression this guards: createListing used to catch this failure
  // internally and resolve to undefined, which made the wallet-action state
  // machine (useWalletWriteAction.run) unconditionally report "success" —
  // false-positive success UI (including confetti) for a listing that was
  // never actually confirmed onchain.
  expect(thrown).toBeInstanceOf(Error);
  expect(result.current.error).toBeTruthy();
});
