import { test, expect, mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { renderHook, waitFor, act } from "@testing-library/react";
import { hash } from "starknet";
import { getStarknetCoordinates } from "@medialane/sdk";
import type { CreatorCoinReceiptLike } from "@medialane/sdk/starknet";

if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register();

const FACTORY = getStarknetCoordinates("STARKNET").creatorCoinFactory!;

mock.module("@/lib/reward-toast", () => ({ rewardToast: () => {} }));

function fakeClient(overrides: Record<string, unknown> = {}) {
  return {
    api: {
      createCoinIntent: async () => ({ data: { requiresSignature: false, calls: [{ contractAddress: "0x1", entrypoint: "e", calldata: [] }] } }),
      launchCoinIntent: async () => ({ data: { requiresSignature: false, calls: [{ contractAddress: "0x1", entrypoint: "e", calldata: [] }] } }),
      ...overrides,
    },
  };
}

mock.module("@/hooks/use-medialane-client", () => ({
  useMedialaneClient: () => fakeClient(),
}));

const { useLaunchCoin } = await import("./use-launch-coin");
const { parseCreatorCoinCreated } = await import("@medialane/sdk/starknet");

function fakeSigner(execute: () => Promise<{ txHash: string }>) {
  return { address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7", signTypedData: async () => ["0xr", "0xs"], execute } as never;
}

const VERIFY_OK = async () => {};

// A receipt shape parseCreatorCoinCreated (the real, unmocked SDK function)
// will actually accept — build it from the real selector it looks for
// rather than guessing the event shape.
function fakeReceipt(): CreatorCoinReceiptLike {
  const selector = hash.getSelectorFromName("CreatorCoinCreated");
  return {
    events: [
      { from_address: FACTORY, keys: [selector], data: ["0x0", "0xcc1"] },
    ],
  } as CreatorCoinReceiptLike;
}

const GET_RECEIPT_OK = async () => fakeReceipt();

test("launch succeeds when both transactions are verified onchain", async () => {
  const { result } = renderHook(() => useLaunchCoin({ verify: VERIFY_OK, getReceipt: GET_RECEIPT_OK }));

  let output: { coinAddress: string; txHash: string } | undefined;
  await act(async () => {
    output = await result.current.launch(
      { name: "Test Coin", symbol: "TST", supplyHuman: "1000000", quoteSymbol: "USDC", price: 0.01, teamPct: 0 },
      fakeSigner(async () => ({ txHash: "0xlaunch" })),
      "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    );
  });

  expect(output?.txHash).toBe("0xlaunch");
  expect(output?.coinAddress).toBe(parseCreatorCoinCreated(fakeReceipt()));
  await waitFor(() => expect(result.current.status).toBe("done"));
});

test("launch does not report done when the launch (fund-moving) transaction reverted onchain", async () => {
  const verifyReverted = async (txHash: string) => {
    throw new Error(`Transaction ${txHash} was submitted but reverted onchain. Please check your balance and try again.`);
  };
  const { result } = renderHook(() => useLaunchCoin({ verify: verifyReverted, getReceipt: GET_RECEIPT_OK }));

  let caught: unknown;
  await act(async () => {
    try {
      await result.current.launch(
        { name: "Test Coin", symbol: "TST", supplyHuman: "1000000", quoteSymbol: "USDC", price: 0.01, teamPct: 0 },
        fakeSigner(async () => ({ txHash: "0xlaunch" })),
        "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
      );
    } catch (err) {
      caught = err;
    }
  });

  expect(caught).toBeInstanceOf(Error);
  await waitFor(() => expect(result.current.status).toBe("error"));
  expect(result.current.error).toContain("reverted onchain");
});
