import { test, expect } from "bun:test";
import { starknetVenueSigner } from "./venue-signer";
import type { SealedOwner } from "./passkey";

const FAKE_SEALED: SealedOwner = {
  credentialId: "cred1", ownerPubKey: "0xabc", address: "0xdeadbeef", iv: "iv1", ciphertext: "ct1",
};

test("starknetVenueSigner exposes the wallet's address", () => {
  const signer = starknetVenueSigner(FAKE_SEALED);
  expect(signer.address).toBe("0xdeadbeef");
});
