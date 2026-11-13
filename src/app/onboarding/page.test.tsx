import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { mockForThisFile } from "../../../test/mock-for-this-file";

const replaced: string[] = [];
let search = "";
let account: { email: string; walletAddress: string | null } | null = null;
let loading = false;
let hasKey = false;

await mockForThisFile("next/navigation", {
  useRouter: () => ({ replace: (to: string) => replaced.push(to), push: () => {} }) as never,
  useSearchParams: () => new URLSearchParams(search) as never,
});
await mockForThisFile("@/hooks/use-wallet-native-session", {
  useWalletNativeSession: () => ({ hasWallet: hasKey, isDeployed: null }) as never,
});
await mockForThisFile("@medialane/ui/utils/use-session", { useSession: () => ({ session: account, isLoading: loading }) as never });

const { default: OnboardingPage } = await import("./page");

beforeEach(() => {
  replaced.length = 0;
  search = "";
  account = null;
  loading = false;
  hasKey = false;
});
afterEach(cleanup);

describe("someone who is not signed in opens /onboarding", () => {
  test("is sent to sign in, and on to the page they asked for", () => {
    search = "redirect_url=%2Fportfolio";
    render(<OnboardingPage />);
    expect(replaced).toEqual(["/connect?redirect_url=%2Fportfolio"]);
  });

  test("with no page asked for, is sent on to the default one", () => {
    render(<OnboardingPage />);
    expect(replaced).toEqual(["/connect?redirect_url=%2Fairdrop"]);
  });

  test("is not sent anywhere before the session is known", () => {
    loading = true;
    const { container } = render(<OnboardingPage />);
    expect(replaced).toEqual([]);
    expect(container.textContent).toBe("");
  });

  test("an account whose wallet is not on this browser is sent to sign in, not shown a recovery screen", () => {
    account = { email: "a@b.com", walletAddress: "0xabc" };
    search = "redirect_url=%2Fportfolio";
    render(<OnboardingPage />);
    expect(replaced).toEqual(["/connect?redirect_url=%2Fportfolio"]);
  });
});
