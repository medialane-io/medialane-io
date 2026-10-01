import { test, expect } from "bun:test";
import { typedData as starknetTypedData } from "starknet";
import { computeOwnerGuid, ownerAliveTypedData, signWithPrivateKey, starkKeyPairFromPrivateKey } from "@medialane/sdk/starknet";
import { setupWalletKey, type WalletKeySetupDeps } from "./key-setup";

const privateKeyHex = "0x1234567890abcdef";
const ownerPubKey = starkKeyPairFromPrivateKey(privateKeyHex).publicKeyHex;

function deps(setup: WalletKeySetupDeps["setup"]) {
  const sent: unknown[] = [];
  const saved: unknown[] = [];
  const d: WalletKeySetupDeps = {
    createOwnerKey: async () => ({
      privateKeyHex,
      sealed: { credentialId: "c", ownerPubKey, address: "", iv: "i", ciphertext: "x" },
    }),
    setup: async (params) => {
      sent.push(params);
      return setup(params);
    },
    save: (sealed) => {
      saved.push(sealed);
    },
    now: () => 1_000,
  };
  return { d, sent, saved };
}

test("signs the owner-alive proof for the wallet with the new key", async () => {
  const { d, sent } = deps(async () => ({ walletAddress: "0xabc" }));
  await setupWalletKey("0xabc", d);
  const expected = signWithPrivateKey(
    privateKeyHex,
    starknetTypedData.getMessageHash(ownerAliveTypedData(computeOwnerGuid(ownerPubKey), 1_600, "SN_MAIN") as never, "0xabc"),
  );
  expect(sent).toEqual([{ newOwnerPubkey: ownerPubKey, signature: expected, expiration: 1_600 }]);
});

test("saves the new key for the wallet's address", async () => {
  const { d, saved } = deps(async () => ({ walletAddress: "0xabc" }));
  await setupWalletKey("0xabc", d);
  expect(saved).toEqual([{ credentialId: "c", ownerPubKey, address: "0xabc", iv: "i", ciphertext: "x" }]);
});

test("saves nothing when the setup is refused", async () => {
  const { d, saved } = deps(async () => {
    throw new Error("Verify your email first");
  });
  await expect(setupWalletKey("0xabc", d)).rejects.toThrow("Verify your email first");
  expect(saved).toEqual([]);
});
