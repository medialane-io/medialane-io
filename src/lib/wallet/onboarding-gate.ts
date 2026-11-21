import type { WalletStatus } from "./wallet-status";

export interface OnboardingGateState {
  pathname: string;
  status: WalletStatus;
  isDeploying: boolean;
}

const SETS_UP_ITSELF = ["/airdrop", "/connect", "/onboarding", "/confirm-email"];

const onAny = (pathname: string, prefixes: string[]): boolean => prefixes.some((p) => pathname.startsWith(p));

const withReturnTo = (target: string, pathname: string): string =>
  `${target}?redirect_url=${encodeURIComponent(pathname)}`;

export function resolveOnboardingRedirect({ pathname, status, isDeploying }: OnboardingGateState): string | null {
  if (status === "needs-setup" && !isDeploying && !onAny(pathname, SETS_UP_ITSELF)) {
    return withReturnTo("/onboarding", pathname);
  }
  return null;
}
