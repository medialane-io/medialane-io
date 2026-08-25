import { describe, expect, test, mock, afterEach } from "bun:test";
import {
  buildSetFirstGuardianCall,
  buildTriggerEscapeOwnerCall,
  buildCompleteEscapeOwnerCall,
  buildCancelEscapeCall,
} from "@medialane/sdk/starknet";
import type { SealedOwner } from "./passkey";
import { registerSelfFundConsentHandler } from "./self-fund-consent";

const FAKE_SEALED: SealedOwner = {
  credentialId: "cred1", ownerPubKey: "0xabc", address: "0xdeadbeef", iv: "iv1", ciphertext: "ct1",
};

afterEach(() => registerSelfFundConsentHandler(null));

// The calldata-encoding behavior itself is covered upstream by
// @medialane/sdk's own guardian.test.ts — this file only proves io's
// migration wired the SDK module in correctly, without re-mocking
// "@medialane/sdk/starknet" directly (mock.module on a shared module leaks
// across test files in the same bun test run and broke that file's own
// tests when tried here). "./sponsored-executor" is a small, io-local
// module only imported by venue-signer.ts/guardian.ts — safe to mock.
// "./self-fund-consent" is used FOR REAL (registerSelfFundConsentHandler
// directly, not mock.module) since it's a tiny pure primitive shared by
// multiple test files — mock.module-ing it here would replace the module
// for every other file in the same bun test run too, same hazard as above.
describe("io guardian module", () => {
  test("re-exports the SDK's guardian calldata builders unchanged", async () => {
    const guardian = await import("./guardian");
    expect(guardian.buildSetFirstGuardianCall).toBe(buildSetFirstGuardianCall);
    expect(guardian.buildTriggerEscapeOwnerCall).toBe(buildTriggerEscapeOwnerCall);
    expect(guardian.buildCompleteEscapeOwnerCall).toBe(buildCompleteEscapeOwnerCall);
    expect(guardian.buildCancelEscapeCall).toBe(buildCancelEscapeCall);
  });

  test("exposes the AVNU-sponsored execution wrappers", async () => {
    const guardian = await import("./guardian");
    expect(typeof guardian.setFirstGuardian).toBe("function");
    expect(typeof guardian.triggerEscapeOwner).toBe("function");
    expect(typeof guardian.completeEscapeOwner).toBe("function");
    expect(typeof guardian.cancelEscape).toBe("function");
    expect(typeof guardian.getGuardians).toBe("function");
    expect(typeof guardian.getEscape).toBe("function");
    expect(typeof guardian.getEscapeSecurityPeriod).toBe("function");
  });

  test("setFirstGuardian self-funds when sponsorship is unavailable and the user consents", async () => {
    mock.module("./passkey", () => ({
      unlockOwnerKey: async () => "0xprivkey",
      signWithPrivateKey: () => ["0xr", "0xs"] as [string, string],
    }));
    mock.module("./sponsored-executor", () => ({
      executeSponsored: async () => ({ status: "unavailable", reason: "no credits" }),
      SponsoredCallRejectedError: class extends Error {},
    }));
    registerSelfFundConsentHandler(async () => true);
    let selfFundedCalls = 0;
    mock.module("./self-funded", () => ({
      executeSelfFunded: async () => {
        selfFundedCalls++;
        return { transactionHash: "0xselffunded" };
      },
    }));

    const { setFirstGuardian } = await import("./guardian");
    const txHash = await setFirstGuardian(FAKE_SEALED, "0xabc");

    expect(selfFundedCalls).toBe(1);
    expect(txHash).toBe("0xselffunded");
  });

  test("setFirstGuardian throws without self-funding when the user declines", async () => {
    mock.module("./passkey", () => ({
      unlockOwnerKey: async () => "0xprivkey",
      signWithPrivateKey: () => ["0xr", "0xs"] as [string, string],
    }));
    mock.module("./sponsored-executor", () => ({
      executeSponsored: async () => ({ status: "unavailable", reason: "no credits" }),
      SponsoredCallRejectedError: class extends Error {},
    }));
    registerSelfFundConsentHandler(async () => false);
    let selfFundedCalls = 0;
    mock.module("./self-funded", () => ({
      executeSelfFunded: async () => {
        selfFundedCalls++;
        return { transactionHash: "0xselffunded" };
      },
    }));

    const { setFirstGuardian } = await import("./guardian");
    await expect(setFirstGuardian(FAKE_SEALED, "0xabc")).rejects.toThrow("no credits");
    expect(selfFundedCalls).toBe(0);
  });
});
