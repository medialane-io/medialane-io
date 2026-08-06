import { test, expect, beforeEach, mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { renderHook, waitFor } from "@testing-library/react";

// bun test's runtime has no DOM by default. renderHook needs a real
// `document` (not just `window`/`localStorage` stubs — Phase 0+1's simpler
// shim was enough for store.test.ts, but not for actually mounting a React
// tree). happy-dom's global registrator provides a full DOM implementation.
// Guarded: multiple test files run in the same process during a full suite
// run, and double-registration throws.
if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register();

// account-ops's isDeployed() makes a real RPC call — mock just that export
// (keeping the rest real, since venue-signer.ts also imports `execute` from
// this same module) so this stays a unit test with no live network I/O as a
// side effect of rendering the hook.
const realAccountOps = await import("@/lib/wallet/account-ops");
mock.module("@/lib/wallet/account-ops", () => ({
  ...realAccountOps,
  isDeployed: async () => false,
}));

const { useWalletNativeSession } = await import("./use-wallet-native-session");
const { saveSealedOwner, clearSealedOwner } = await import("@/lib/wallet/store");

const FAKE = {
  credentialId: "cred1", ownerPubKey: "0xabc", address: "0xdeadbeef", iv: "iv1", ciphertext: "ct1",
};

beforeEach(() => {
  localStorage.clear();
});

test("returns no wallet when nothing is stored", async () => {
  const { result } = renderHook(() => useWalletNativeSession());
  expect(result.current.address).toBeNull();
  expect(result.current.hasWallet).toBe(false);
  expect(result.current.signer).toBeNull();
  // No sealed owner -> isDeployed is never called, state settles at null
  // immediately, but await one tick so the effect is fully flushed before
  // the test ends (keeps every test symmetric, avoids act() warnings).
  await waitFor(() => expect(result.current.isDeployed).toBeNull());
});

test("returns the stored wallet's address and a signer once one exists", async () => {
  saveSealedOwner(FAKE);
  const { result } = renderHook(() => useWalletNativeSession());
  expect(result.current.address).toBe("0xdeadbeef");
  expect(result.current.hasWallet).toBe(true);
  expect(result.current.signer?.address).toBe("0xdeadbeef");
  // isDeployed resolves asynchronously (mocked to false above) — wait for
  // that state update so it's inside act(), not left dangling past the test.
  await waitFor(() => expect(result.current.isDeployed).toBe(false));
  clearSealedOwner();
});
