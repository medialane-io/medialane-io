import { test, expect, mock } from "bun:test";
import type { SealedOwner } from "./passkey";

const FAKE_SEALED: SealedOwner = {
  credentialId: "cred1", ownerPubKey: "0xabc", address: "0xdeadbeef", iv: "iv1", ciphertext: "ct1",
};

test("resuming an existing wallet unlocks the passkey once, reused for deploy + sign-in", async () => {
  let unlockCalls = 0;

  mock.module("./passkey", () => ({
    createOwnerKey: async () => {
      throw new Error("should not create a new key when a sealed wallet already exists");
    },
    unlockOwnerKey: async () => {
      unlockCalls++;
      return "0xprivkey";
    },
    signWithPrivateKey: () => ["0xr", "0xs"] as [string, string],
  }));
  mock.module("./store", () => ({
    loadSealedOwner: () => FAKE_SEALED,
    saveSealedOwner: () => {},
    notifyWalletChange: () => {},
  }));
  mock.module("./deploy-relay", () => ({
    deployWalletSponsored: async () => ({ transactionHash: "0xtxhash" }),
  }));
  mock.module("@medialane/sdk/starknet", () => ({
    requestSiwsToken: async ({ signer }: { signer: { signMessage: (td: unknown) => Promise<unknown> } }) => {
      await signer.signMessage({
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
      return "siws-token";
    },
  }));

  const { completeWalletDeployment } = await import("./complete-deployment");
  const steps: string[] = [];
  const result = await completeWalletDeployment((step) => steps.push(step));

  expect(result.siwsToken).toBe("siws-token");
  expect(steps).toEqual(["deploying", "signing-in"]);
  expect(unlockCalls).toBe(1);
});
