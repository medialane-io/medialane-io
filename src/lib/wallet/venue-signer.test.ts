import { test, expect, mock } from "bun:test";
import type { SealedOwner } from "./passkey";

const FAKE_SEALED: SealedOwner = {
  credentialId: "cred1", ownerPubKey: "0xabc", address: "0xdeadbeef", iv: "iv1", ciphertext: "ct1",
};

test("starknetVenueSigner exposes the wallet's address", async () => {
  const { starknetVenueSigner } = await import("./venue-signer");
  const signer = starknetVenueSigner(FAKE_SEALED);
  expect(signer.address).toBe("0xdeadbeef");
});

test("signTypedData followed by execute only prompts the passkey once", async () => {
  let unlockCalls = 0;
  mock.module("./passkey", () => ({
    unlockOwnerKey: async () => {
      unlockCalls++;
      return "0xprivkey";
    },
    signWithPrivateKey: () => ["0xr", "0xs"] as [string, string],
  }));
  mock.module("./sponsored-invoke", () => ({
    executeSponsored: async () => ({ transactionHash: "0xtxhash" }),
  }));

  const { starknetVenueSigner } = await import("./venue-signer");
  const signer = starknetVenueSigner(FAKE_SEALED);

  await signer.signTypedData({
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" },
      ],
      Ping: [{ name: "value", type: "felt" }],
    },
    primaryType: "Ping",
    domain: { name: "test", version: "1", chainId: "SN_MAIN", revision: "1" },
    message: { value: "1" },
  });
  await signer.execute([{ contractAddress: "0x1", entrypoint: "foo", calldata: [] }]);

  expect(unlockCalls).toBe(1);

  // A stable, memoized `signer` instance must not keep unlocking forever —
  // lockVenueSigner bounds the cached key's lifetime to one action.
  const { lockVenueSigner } = await import("./venue-signer");
  lockVenueSigner(FAKE_SEALED.address);
  await signer.signTypedData({
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" },
      ],
      Ping: [{ name: "value", type: "felt" }],
    },
    primaryType: "Ping",
    domain: { name: "test", version: "1", chainId: "SN_MAIN", revision: "1" },
    message: { value: "1" },
  });
  expect(unlockCalls).toBe(2);

  lockVenueSigner(FAKE_SEALED.address);
});

test("execute falls back to a self-funded transaction when the sponsor is unavailable before broadcasting", async () => {
  mock.module("./passkey", () => ({
    unlockOwnerKey: async () => "0xprivkey",
    signWithPrivateKey: () => ["0xr", "0xs"] as [string, string],
  }));
  class SponsorUnavailableError extends Error {}
  mock.module("./sponsored-invoke", () => ({
    SponsorUnavailableError,
    executeSponsored: async () => {
      throw new SponsorUnavailableError("AVNU unavailable");
    },
  }));
  let selfFundedCalls = 0;
  mock.module("./self-funded", () => ({
    executeSelfFunded: async () => {
      selfFundedCalls++;
      return { transactionHash: "0xselffunded" };
    },
  }));

  const { starknetVenueSigner, lockVenueSigner } = await import("./venue-signer");
  const signer = starknetVenueSigner(FAKE_SEALED);
  const result = await signer.execute([{ contractAddress: "0x1", entrypoint: "foo", calldata: [] }]);

  expect(selfFundedCalls).toBe(1);
  expect(result.txHash).toBe("0xselffunded");

  lockVenueSigner(FAKE_SEALED.address);
});

test("execute does not fall back when the sponsored call may already have broadcast", async () => {
  mock.module("./passkey", () => ({
    unlockOwnerKey: async () => "0xprivkey",
    signWithPrivateKey: () => ["0xr", "0xs"] as [string, string],
  }));
  class SponsorUnavailableError extends Error {}
  mock.module("./sponsored-invoke", () => ({
    SponsorUnavailableError,
    executeSponsored: async () => {
      throw new Error("We couldn't submit this transaction. Please try again.");
    },
  }));
  let selfFundedCalls = 0;
  mock.module("./self-funded", () => ({
    executeSelfFunded: async () => {
      selfFundedCalls++;
      return { transactionHash: "0xselffunded" };
    },
  }));

  const { starknetVenueSigner, lockVenueSigner } = await import("./venue-signer");
  const signer = starknetVenueSigner(FAKE_SEALED);

  await expect(
    signer.execute([{ contractAddress: "0x1", entrypoint: "foo", calldata: [] }]),
  ).rejects.toThrow("We couldn't submit this transaction. Please try again.");
  expect(selfFundedCalls).toBe(0);

  lockVenueSigner(FAKE_SEALED.address);
});
