import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";

const replaced: string[] = [];
let search = "";
let account: { email: string; walletAddress: string | null } | null = null;
let loading = false;

const real = {
  navigation: await import("next/navigation"),
  session: await import("@/hooks/use-session"),
};
mock.module("next/navigation", () => ({
  ...real.navigation,
  useRouter: () => ({ replace: (to: string) => replaced.push(to), push: () => {} }),
  useSearchParams: () => new URLSearchParams(search),
}));
mock.module("@/hooks/use-session", () => ({ ...real.session, useSession: () => ({ session: account, isLoading: loading }) }));

const { default: OnboardingPage } = await import("./page");

beforeEach(() => {
  replaced.length = 0;
  search = "";
  account = null;
  loading = false;
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
});
