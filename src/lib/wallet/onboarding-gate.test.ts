import { describe, expect, test } from "bun:test";
import { resolveOnboardingRedirect, type OnboardingGateState } from "./onboarding-gate";

const READY: OnboardingGateState = { pathname: "/portfolio", status: "ready", isDeploying: false };

const gate = (overrides: Partial<OnboardingGateState>) => resolveOnboardingRedirect({ ...READY, ...overrides });

describe("a wallet that works on this browser", () => {
  test("is left alone", () => {
    expect(gate({})).toBeNull();
  });
});

describe("someone not signed in", () => {
  test("is left alone", () => {
    expect(gate({ status: "none" })).toBeNull();
  });
});

describe("a wallet that is still being checked", () => {
  test("is left alone until the answer is known", () => {
    expect(gate({ status: "checking" })).toBeNull();
  });
});

describe("a signed-in user whose wallet needs setup on this browser", () => {
  const NEEDS_SETUP: Partial<OnboardingGateState> = { status: "needs-setup" };

  test("is sent to onboarding, and brought back to the page it was on", () => {
    expect(gate(NEEDS_SETUP)).toBe("/onboarding?redirect_url=%2Fportfolio");
  });

  test("is not sent anywhere while a setup is still running, so the passkey is asked for once", () => {
    expect(gate({ ...NEEDS_SETUP, isDeploying: true })).toBeNull();
  });

  test("is not sent away from the pages that run the setup themselves", () => {
    for (const pathname of ["/connect", "/onboarding", "/airdrop", "/mint/x", "/br/mint", "/confirm-email"]) {
      expect(gate({ ...NEEDS_SETUP, pathname })).toBeNull();
    }
  });
});
