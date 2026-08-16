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
