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
const { useTransfer } = await import("./use-transfer");

// The default `verify` param (assertTransactionSucceeded) hits real RPC —
// tests pass their own fake instead of mocking the shared ./intent-tx
// module (used by many other pages, has its own dedicated test file).
const VERIFY_OK = async () => {};

test("transferToken succeeds when the transaction is verified onchain", async () => {
  const { result } = renderHook(() => useTransfer(VERIFY_OK));

  let txHash: string | undefined;
  await act(async () => {
    txHash = await result.current.transferToken({
      contractAddress: "0x1", tokenId: "1", toAddress: "0x2", tokenStandard: "ERC721",
    });
  });

  expect(txHash).toBe("0xtx");
  expect(result.current.error).toBeNull();
});

test("transferToken surfaces an error and does not report success when the transfer reverted onchain", async () => {
  const verifyReverted = async (txHash: string) => {
    throw new Error(`Transaction ${txHash} was submitted but reverted onchain. Please check your balance and try again.`);
  };
  const { result } = renderHook(() => useTransfer(verifyReverted));

  let caught: unknown;
  await act(async () => {
    try {
      await result.current.transferToken({
        contractAddress: "0x1", tokenId: "1", toAddress: "0x2", tokenStandard: "ERC721",
      });
    } catch (err) {
      caught = err;
    }
  });

  expect(caught).toBeInstanceOf(Error);
  expect((caught as Error).message).toContain("reverted onchain");
  await waitFor(() => expect(result.current.error).toContain("reverted onchain"));
});
