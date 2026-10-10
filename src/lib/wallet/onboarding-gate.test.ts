import { describe, expect, test } from "bun:test";
import { resolveOnboardingRedirect, type OnboardingGateState } from "./onboarding-gate";

const SIGNED_UP: OnboardingGateState = {
  pathname: "/portfolio",
  hasWallet: true,
  isDeployed: true,
  isDeploying: false,
};

const gate = (overrides: Partial<OnboardingGateState>) => resolveOnboardingRedirect({ ...SIGNED_UP, ...overrides });

describe("someone with no wallet", () => {
  test("is left alone", () => {
    expect(gate({ hasWallet: false, isDeployed: false })).toBeNull();
  });
});

describe("a finished account", () => {
  test("is left alone", () => {
    expect(gate({})).toBeNull();
  });

  test("is left alone while we still don't know whether it is deployed", () => {
    expect(gate({ isDeployed: null })).toBeNull();
  });
});

describe("a wallet that never finished deploying", () => {
  test("is sent to finish, and brought back to the page it was on", () => {
    expect(gate({ isDeployed: false })).toBe("/wallet-onboarding?redirect_url=%2Fportfolio");
  });

  test("is not sent anywhere while a setup is still running, so the passkey is asked for once", () => {
    expect(gate({ isDeployed: false, isDeploying: true })).toBeNull();
  });

  test("is not sent away from the pages that run the setup themselves", () => {
    for (const pathname of ["/connect", "/wallet-onboarding", "/airdrop", "/mint/x", "/br/mint"]) {
      expect(gate({ pathname, isDeployed: false })).toBeNull();
    }
  });

});
