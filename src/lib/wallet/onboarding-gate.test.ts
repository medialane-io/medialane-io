import { describe, expect, test } from "bun:test";
import { resolveOnboardingRedirect, type OnboardingGateState } from "./onboarding-gate";

const SIGNED_UP: OnboardingGateState = {
  pathname: "/portfolio",
  hasWallet: true,
  isDeployed: true,
  isDeploying: false,
  accountWithoutWallet: false,
};

const gate = (overrides: Partial<OnboardingGateState>) => resolveOnboardingRedirect({ ...SIGNED_UP, ...overrides });

describe("someone with no wallet on this browser", () => {
  test("is left alone", () => {
    expect(gate({ hasWallet: false, isDeployed: null })).toBeNull();
  });
});

describe("a signed-in account that has no wallet", () => {
  const NO_WALLET: Partial<OnboardingGateState> = { hasWallet: false, isDeployed: null, accountWithoutWallet: true };

  test("is sent to finish setting up, and brought back to the page it was on", () => {
    expect(gate(NO_WALLET)).toBe("/onboarding?redirect_url=%2Fportfolio");
  });

  test("is not sent anywhere while a setup is still running", () => {
    expect(gate({ ...NO_WALLET, isDeploying: true })).toBeNull();
  });

  test("is not sent away from the pages that run the setup themselves", () => {
    for (const pathname of ["/connect", "/onboarding", "/airdrop", "/mint/x", "/br/mint", "/confirm-email"]) {
      expect(gate({ ...NO_WALLET, pathname })).toBeNull();
    }
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
    expect(gate({ isDeployed: false })).toBe("/onboarding?redirect_url=%2Fportfolio");
  });

  test("is not sent anywhere while a setup is still running, so the passkey is asked for once", () => {
    expect(gate({ isDeployed: false, isDeploying: true })).toBeNull();
  });

  test("is not sent away from the pages that run the setup themselves", () => {
    for (const pathname of ["/connect", "/onboarding", "/airdrop", "/mint/x", "/br/mint"]) {
      expect(gate({ pathname, isDeployed: false })).toBeNull();
    }
  });

});
