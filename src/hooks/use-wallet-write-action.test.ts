import { test, expect, mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { renderHook, waitFor, act } from "@testing-library/react";

GlobalRegistrator.register();

const FAKE_SEALED = {
  credentialId: "cred1", ownerPubKey: "0xabc", address: "0xdeadbeef", iv: "iv1", ciphertext: "ct1",
};

// Mock the session hook directly — this test is about the write-action state
// machine, not wallet-native-session's own already-tested logic.
mock.module("./use-wallet-native-session", () => ({
  useWalletNativeSession: () => ({
    address: FAKE_SEALED.address,
    hasWallet: true,
    isDeployed: true,
    signer: { address: FAKE_SEALED.address, signTypedData: async () => ["0xr", "0xs"], execute: async () => ({ txHash: "0xtx" }) },
  }),
}));

const { useWalletWriteAction } = await import("./use-wallet-write-action");

test("run executes successfully and reaches success status", async () => {
  const { result } = renderHook(() => useWalletWriteAction());
  expect(result.current.status).toBe("idle");

  await act(async () => {
    await result.current.run(async (signer) => signer.execute([]));
  });

  await waitFor(() => expect(result.current.status).toBe("success"));
  expect(result.current.txHash).toBe("0xtx");
  expect(result.current.error).toBeNull();
});

test("run surfaces a thrown error and reaches error status", async () => {
  const { result } = renderHook(() => useWalletWriteAction());

  await act(async () => {
    await result.current.run(async () => { throw new Error("execution reverted"); });
  });

  await waitFor(() => expect(result.current.status).toBe("error"));
  expect(result.current.error).toBe("execution reverted");
});

test("reset returns to idle", async () => {
  const { result } = renderHook(() => useWalletWriteAction());
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
  const { result } = renderHook(() => useNoWallet());
  expect(result.current.walletNotReady).toBe(true);

  await act(async () => {
    await result.current.run(async (signer) => signer.execute([]));
  });
  expect(result.current.status).toBe("idle"); // never ran
});
