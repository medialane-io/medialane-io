import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { mockForThisFile } from "../../../test/mock-for-this-file";

const pushed: string[] = [];
let pathname = "/portfolio";
let deploying = false;
let session = { hasWallet: true, isDeployed: false as boolean | null };
let account: { walletAddress: string | null } | null = null;
let accountLoading = false;

await mockForThisFile("next/navigation", {
  useRouter: () => ({ push: (to: string) => pushed.push(to) }) as never,
  usePathname: () => pathname,
});
await mockForThisFile("@/hooks/use-session", { useSession: () => ({ session: account, isLoading: accountLoading }) as never });
await mockForThisFile("@/hooks/use-wallet-native-session", { useWalletNativeSession: () => session as never });
await mockForThisFile<typeof import("@/lib/wallet/client")>("@/lib/wallet/client", (real) => ({
  mediaWallet: { ...real.mediaWallet, isDeploying: () => deploying },
}));

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


  test("sends a signed-in account that has no wallet to finish setting up, and back afterwards", () => {
    session = { hasWallet: false, isDeployed: null };
    account = { walletAddress: null };
    render(<OnboardingGate />);
    expect(pushed).toEqual(["/onboarding?redirect_url=%2Fportfolio"]);
  });

  test("never sends an account that has a wallet, even when this browser does not hold its key", () => {
    session = { hasWallet: false, isDeployed: null };
    account = { walletAddress: "0xabc" };
    render(<OnboardingGate />);
    expect(pushed).toEqual([]);
  });

  test("waits for the session before deciding", () => {
    session = { hasWallet: false, isDeployed: null };
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
