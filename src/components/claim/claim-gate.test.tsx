import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { forwardRef } from "react";
import { mockForThisFile } from "../../../test/mock-for-this-file";

let hasWallet = false;
await mockForThisFile("@/hooks/use-wallet-native-session", { useWalletNativeSession: () => ({ hasWallet }) as never });
await mockForThisFile("next/navigation", { usePathname: () => "/claim/username" });
await mockForThisFile("next/link", {
  default: forwardRef<HTMLAnchorElement, { href: string; children: React.ReactNode }>(function Link({ href, children, ...rest }, ref) {
    return (
      <a ref={ref} href={href} {...rest}>
        {children}
      </a>
    );
  }) as never,
});

const { ClaimGate } = await import("./claim-gate");

afterEach(cleanup);

describe("a claim page when someone is signed out", () => {
  test("shows a sign-in prompt instead of the form", () => {
    hasWallet = false;
    render(
      <ClaimGate>
        <p>the claim form</p>
      </ClaimGate>,
    );
    expect(screen.queryByText("the claim form")).toBeNull();
    expect(screen.getByText("Secure your account to make a claim")).toBeTruthy();
  });

  test("the button takes them to sign in and brings them back to this claim page", () => {
    hasWallet = false;
    render(
      <ClaimGate>
        <p>the claim form</p>
      </ClaimGate>,
    );
    const link = screen.getByRole("link", { name: "Get started" });
    expect(link.getAttribute("href")).toBe("/connect?redirect_url=%2Fclaim%2Fusername");
  });
});

describe("a claim page when someone is signed in", () => {
  test("shows the form and no prompt", () => {
    hasWallet = true;
    render(
      <ClaimGate>
        <p>the claim form</p>
      </ClaimGate>,
    );
    expect(screen.getByText("the claim form")).toBeTruthy();
    expect(screen.queryByText("Secure your account to make a claim")).toBeNull();
  });
});
