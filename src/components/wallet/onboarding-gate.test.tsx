import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { mockForThisFile } from "../../../test/mock-for-this-file";
import type { WalletStatus } from "@/lib/wallet/wallet-status";

const pushed: string[] = [];
let pathname = "/portfolio";
let deploying = false;
let status: WalletStatus = "needs-setup";

await mockForThisFile("next/navigation", {
  useRouter: () => ({ push: (to: string) => pushed.push(to) }) as never,
  usePathname: () => pathname,
});
await mockForThisFile("@/hooks/use-wallet-native-session", { useWalletNativeSession: () => ({ status }) as never });
await mockForThisFile<typeof import("@/lib/wallet/client")>("@/lib/wallet/client", (real) => ({
  mediaWallet: { ...real.mediaWallet, isDeploying: () => deploying },
}));

const { OnboardingGate } = await import("./onboarding-gate");

beforeEach(() => {
  pushed.length = 0;
  pathname = "/portfolio";
  deploying = false;
  status = "needs-setup";
});
afterEach(cleanup);

describe("the onboarding gate", () => {
  test("sends someone whose wallet needs setup on this browser to onboarding, and back afterwards", () => {
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

  test("does nothing for a ready wallet, while checking, or with no wallet on this browser", () => {
    for (const s of ["ready", "checking", "none"] as const) {
      status = s;
      render(<OnboardingGate />);
      cleanup();
    }
    expect(pushed).toEqual([]);
  });
});
