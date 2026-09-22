import { describe, expect, test } from "bun:test";
import { isWalletStep, walletStepLabel, RESEND_COOLDOWN_SECONDS, type OnboardingStep } from "./onboarding-flow.js";

describe("which steps are wallet setup", () => {
  test("the three wallet steps are wallet steps", () => {
    for (const step of ["creating-passkey", "deploying", "signing-in"] as OnboardingStep[]) {
      expect(isWalletStep(step)).toBe(true);
    }
  });

  test("the email steps are not", () => {
    for (const step of ["email", "checking-email", "registering", "code", "verifying-code", "add-email"] as OnboardingStep[]) {
      expect(isWalletStep(step)).toBe(false);
    }
  });

  test("done is not a wallet step, so it renders as finished rather than loading", () => {
    expect(isWalletStep("done")).toBe(false);
  });
});

describe("what the person is told while the wallet is made", () => {
  test("each stage says what is happening", () => {
    expect(walletStepLabel("creating-passkey")).toBe("Creating passkey…");
    expect(walletStepLabel("deploying")).toBe("Setting up your wallet…");
    expect(walletStepLabel("signing-in")).toBe("Signing in…");
  });

  test("an unexpected stage still says something rather than nothing", () => {
    expect(walletStepLabel("email")).toBe("Creating passkey…");
  });
});

describe("resend cooldown", () => {
  test("is a minute, matching the code's own expiry guidance", () => {
    expect(RESEND_COOLDOWN_SECONDS).toBe(60);
  });
});
