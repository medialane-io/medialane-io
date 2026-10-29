import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";

const pushed: string[] = [];
let pathname = "/portfolio";
let deploying = false;
let session = { hasWallet: true, isDeployed: false as boolean | null };
let account: { walletAddress: string | null } | null = null;
let accountLoading = false;

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: (to: string) => pushed.push(to) }),
  usePathname: () => pathname,
}));
const real = {
  session: await import("@/hooks/use-wallet-native-session"),
  account: await import("@/hooks/use-session"),
  client: await import("@/lib/wallet/client"),
};
mock.module("@/hooks/use-session", () => ({ ...real.account, useSession: () => ({ session: account, isLoading: accountLoading }) }));
mock.module("@/hooks/use-wallet-native-session", () => ({ ...real.session, useWalletNativeSession: () => session }));
mock.module("@/lib/wallet/client", () => ({ ...real.client, mediaWallet: { ...real.client.mediaWallet, isDeploying: () => deploying } }));

const { OnboardingGate } = await import("./onboarding-gate");

beforeEach(() => {
  pushed.length = 0;
  pathname = "/portfolio";
  deploying = false;
  session = { hasWallet: true, isDeployed: false };
  account = null;
  accountLoading = false;
});
afterEach(cleanup);

describe("the onboarding gate", () => {
  test("sends someone whose wallet never finished deploying to finish it, and back afterwards", () => {
    render(<OnboardingGate />);
    expect(pushed).toEqual(["/onboarding?redirect_url=%2Fportfolio"]);
  });

  test("does not send them anywhere while a setup is still running, so the passkey is asked for once", () => {
    deploying = true;
    render(<OnboardingGate />);
    expect(pushed).toEqual([]);
  });

  test("leaves the pages that run the setup themselves alone", () => {
    for (const path of ["/connect", "/onboarding", "/airdrop"]) {
      pathname = path;
      render(<OnboardingGate />);
      cleanup();
    }
    expect(pushed).toEqual([]);
  });


  test("sends a signed-in account with no wallet to finish setting up, and back afterwards", () => {
    session = { hasWallet: false, isDeployed: null };
    account = { walletAddress: null };
    render(<OnboardingGate />);
    expect(pushed).toEqual(["/onboarding?redirect_url=%2Fportfolio"]);
  });

  test("sends a signed-in account whose wallet is not on this browser to open it here", () => {
    session = { hasWallet: false, isDeployed: null };
    account = { walletAddress: "0xabc" };
    render(<OnboardingGate />);
    expect(pushed).toEqual(["/onboarding?redirect_url=%2Fportfolio"]);
  });

  test("waits for the session before deciding", () => {
    session = { hasWallet: false, isDeployed: null };
    account = null;
    accountLoading = true;
    render(<OnboardingGate />);
    expect(pushed).toEqual([]);
  });

  test("does nothing for a finished account or for someone signed out", () => {
    session = { hasWallet: true, isDeployed: true };
    render(<OnboardingGate />);
    cleanup();
    session = { hasWallet: false, isDeployed: null };
    render(<OnboardingGate />);
    expect(pushed).toEqual([]);
  });
});
