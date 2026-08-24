import { test, expect, mock } from "bun:test";
import type { SealedOwner } from "./passkey";

const FAKE_SEALED: SealedOwner = {
  credentialId: "cred1", ownerPubKey: "0xabc", address: "0xdeadbeef", iv: "iv1", ciphertext: "ct1",
};

test("cancelEscape falls back to a self-funded transaction when the sponsor is unavailable before broadcasting", async () => {
  mock.module("./passkey", () => ({
    unlockOwnerKey: async () => "0xprivkey",
  }));
  class SponsorUnavailableError extends Error {}
  mock.module("./sponsored-invoke", () => ({
    SponsorUnavailableError,
    executeSponsored: async () => {
      throw new SponsorUnavailableError("AVNU unavailable");
    },
  }));
  let selfFundedAddress: string | null = null;
  mock.module("./self-funded", () => ({
    executeSelfFunded: async (address: string) => {
      selfFundedAddress = address;
      return { transactionHash: "0xselffunded" };
    },
  }));

  const { cancelEscape } = await import("./guardian");
  const txHash = await cancelEscape(FAKE_SEALED);

  expect(txHash).toBe("0xselffunded");
  expect(selfFundedAddress).toBe(FAKE_SEALED.address);
});

test("triggerEscapeOwner falls back using the target account's address, not the guardian's", async () => {
  mock.module("./passkey", () => ({
    unlockOwnerKey: async () => "0xguardianprivkey",
  }));
  class SponsorUnavailableError extends Error {}
  mock.module("./sponsored-invoke", () => ({
    SponsorUnavailableError,
    executeSponsored: async () => {
      throw new SponsorUnavailableError("AVNU unavailable");
    },
  }));
  let selfFundedAddress: string | null = null;
  mock.module("./self-funded", () => ({
    executeSelfFunded: async (address: string) => {
      selfFundedAddress = address;
      return { transactionHash: "0xselffunded" };
    },
  }));

  const { triggerEscapeOwner } = await import("./guardian");
  const targetAddress = "0x1234567890abcdef";
  const txHash = await triggerEscapeOwner(FAKE_SEALED, targetAddress, "0xabc123");

  expect(txHash).toBe("0xselffunded");
  expect(selfFundedAddress).not.toBe(FAKE_SEALED.address);
});
