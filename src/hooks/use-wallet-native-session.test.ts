import { test, expect, beforeEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { renderHook, waitFor } from "@testing-library/react";
import { mockForThisFile } from "../../test/mock-for-this-file";

if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register();

let deployedCheck: () => Promise<boolean> = async () => false;
await mockForThisFile("@/lib/wallet/account-ops", { isDeployed: () => deployedCheck() });

let sessionWallet: string | null = null;
await mockForThisFile("@medialane/ui/utils/use-session", {
  useSession: () => ({ session: sessionWallet ? { walletAddress: sessionWallet } : null, isLoading: false }) as never,
});

let walletCheck: () => Promise<{ type: string }> = async () => ({ type: "finish" });
await mockForThisFile("@/lib/wallet/wallet-step", { checkWalletStep: (() => walletCheck()) as never });

const { useWalletNativeSession } = await import("./use-wallet-native-session");
const { SWRConfig } = await import("swr");
const { createElement } = await import("react");
const fresh = { wrapper: ({ children }: { children: React.ReactNode }) => createElement(SWRConfig, { value: { provider: () => new Map() } }, children) };
const { saveSealedOwner, clearSealedOwner } = await import("@/lib/wallet/store");

const FAKE = {
  credentialId: "cred1", ownerPubKey: "0xabc", address: "0xdeadbeef", iv: "iv1", ciphertext: "ct1",
};

beforeEach(() => {
  localStorage.clear();
  sessionWallet = null;
  deployedCheck = async () => false;
  walletCheck = async () => ({ type: "finish" });
});

test("returns no wallet when nothing is stored", async () => {
  const { result } = renderHook(() => useWalletNativeSession());
  expect(result.current.address).toBeNull();
  expect(result.current.hasWallet).toBe(false);
  expect(result.current.signer).toBeNull();

  await waitFor(() => expect(result.current.isDeployed).toBeNull());
});

test("returns the stored wallet's address and a signer when it is the signed-in account's wallet", async () => {
  sessionWallet = "0xdeadbeef";
  saveSealedOwner(FAKE);
  const { result } = renderHook(() => useWalletNativeSession());
  expect(result.current.address).toBe("0xdeadbeef");
  expect(result.current.hasWallet).toBe(true);
  expect(result.current.signer?.address).toBe("0xdeadbeef");

  await waitFor(() => expect(result.current.isDeployed).toBe(false));
  clearSealedOwner();
});

test("a deploy check that fails leaves it unknown, not undeployed", async () => {
  sessionWallet = "0xdeadbeef";
  saveSealedOwner(FAKE);
  deployedCheck = async () => {
    throw new Error("rpc down");
  };
  const { result } = renderHook(() => useWalletNativeSession());
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(result.current.isDeployed).toBeNull();
  deployedCheck = async () => false;
  clearSealedOwner();
});

test("never uses a stored key that is not the signed-in account's wallet", () => {
  sessionWallet = "0x0123";
  saveSealedOwner(FAKE);
  const { result } = renderHook(() => useWalletNativeSession());
  expect(result.current.hasWallet).toBe(false);
  expect(result.current.address).toBeNull();
  expect(result.current.signer).toBeNull();
  clearSealedOwner();
});

test("uses no wallet when nobody is signed in, even with a key stored", () => {
  saveSealedOwner(FAKE);
  const { result } = renderHook(() => useWalletNativeSession());
  expect(result.current.hasWallet).toBe(false);
  clearSealedOwner();
});

test("is ready, with a signer, when this browser's key is on the deployed wallet and its setup is finished", async () => {
  sessionWallet = "0xdeadbeef";
  saveSealedOwner(FAKE);
  deployedCheck = async () => true;
  const { result } = renderHook(() => useWalletNativeSession(), fresh);
  await waitFor(() => expect(result.current.status).toBe("ready"));
  expect(result.current.hasWallet).toBe(true);
  expect(result.current.signer?.address).toBe("0xdeadbeef");
  clearSealedOwner();
});

test("a key the wallet does not have gives no wallet and no signer, and needs setup", async () => {
  sessionWallet = "0xdeadbeef";
  saveSealedOwner(FAKE);
  deployedCheck = async () => true;
  walletCheck = async () => ({ type: "restore-key" });
  const { result } = renderHook(() => useWalletNativeSession(), fresh);
  await waitFor(() => expect(result.current.status).toBe("needs-setup"));
  expect(result.current.hasWallet).toBe(false);
  expect(result.current.signer).toBeNull();
  expect(result.current.address).toBeNull();
  clearSealedOwner();
});

test("a setup that stopped halfway needs setup", async () => {
  sessionWallet = "0xdeadbeef";
  saveSealedOwner(FAKE);
  deployedCheck = async () => true;
  walletCheck = async () => ({ type: "key-setup" });
  const { result } = renderHook(() => useWalletNativeSession(), fresh);
  await waitFor(() => expect(result.current.status).toBe("needs-setup"));
  expect(result.current.hasWallet).toBe(false);
  clearSealedOwner();
});

test("a wallet check that fails keeps the wallet usable", async () => {
  sessionWallet = "0xdeadbeef";
  saveSealedOwner(FAKE);
  deployedCheck = async () => true;
  walletCheck = async () => {
    throw new Error("rpc down");
  };
  const { result } = renderHook(() => useWalletNativeSession(), fresh);
  await waitFor(() => expect(result.current.status).toBe("ready"));
  expect(result.current.hasWallet).toBe(true);
  clearSealedOwner();
});
