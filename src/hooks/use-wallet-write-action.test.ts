import { test, expect, mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { renderHook, waitFor, act } from "@testing-library/react";

if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register();

const FAKE_SEALED = {
  credentialId: "cred1", ownerPubKey: "0xabc", address: "0xdeadbeef", iv: "iv1", ciphertext: "ct1",
};

mock.module("./use-wallet-native-session", () => ({
  useWalletNativeSession: () => ({
    address: FAKE_SEALED.address,
    hasWallet: true,
    isDeployed: true,
    signer: { address: FAKE_SEALED.address, signTypedData: async () => ["0xr", "0xs"], execute: async () => ({ txHash: "0xtx" }) },
  }),
}));

const { useWalletWriteAction } = await import("./use-wallet-write-action");

// The default `verify` param (assertTransactionSucceeded) hits real RPC —
// every test here passes its own fake instead of mocking the shared
// ./intent-tx module (which has its own dedicated test file and is used by
// many other pages; mock.module on a shared module leaks across test files
// in the same bun test run, per the same lesson already documented in
// guardian.test.ts).
const VERIFY_OK = async () => {};

test("run executes successfully and reaches success status", async () => {
  const { result } = renderHook(() => useWalletWriteAction(VERIFY_OK));
  expect(result.current.status).toBe("idle");

  await act(async () => {
    await result.current.run(async (signer) => signer.execute([]));
  });

  await waitFor(() => expect(result.current.status).toBe("success"));
  expect(result.current.txHash).toBe("0xtx");
  expect(result.current.error).toBeNull();
});

test("run surfaces a thrown error and reaches error status", async () => {
  const { result } = renderHook(() => useWalletWriteAction(VERIFY_OK));

  await act(async () => {
    await result.current.run(async () => { throw new Error("execution reverted"); });
  });

  await waitFor(() => expect(result.current.status).toBe("error"));
  expect(result.current.error).toBe("execution reverted");
});

test("run verifies the transaction actually succeeded onchain before reporting success — a returned txHash alone is not success", async () => {
  const verifyReverted = async (txHash: string) => {
    throw new Error(`Transaction ${txHash} was submitted but reverted onchain. Please check your balance and try again.`);
  };
  const { result } = renderHook(() => useWalletWriteAction(verifyReverted));

  await act(async () => {
    await result.current.run(async (signer) => signer.execute([]));
  });

  await waitFor(() => expect(result.current.status).toBe("error"));
  expect(result.current.error).toContain("reverted onchain");
});

test("reset returns to idle", async () => {
  const { result } = renderHook(() => useWalletWriteAction(VERIFY_OK));
  await act(async () => {
    await result.current.run(async (signer) => signer.execute([]));
  });
  await waitFor(() => expect(result.current.status).toBe("success"));

  act(() => result.current.reset());
  expect(result.current.status).toBe("idle");
  expect(result.current.txHash).toBeNull();
});

test("walletNotReady is true and run is a no-op when there's no wallet", async () => {
  mock.module("./use-wallet-native-session", () => ({
    useWalletNativeSession: () => ({ address: null, hasWallet: false, isDeployed: null, signer: null }),
  }));
  const { useWalletWriteAction: useNoWallet } = await import("./use-wallet-write-action?no-wallet");
  const { result } = renderHook(() => useNoWallet(VERIFY_OK));
  expect(result.current.walletNotReady).toBe(true);

  await act(async () => {
    await result.current.run(async (signer) => signer.execute([]));
  });
  expect(result.current.status).toBe("idle");
});
