import type { WalletStatus } from "./wallet-status";

export interface OnboardingGateState {
  pathname: string;
  status: WalletStatus;
  isDeploying: boolean;
}

const SETS_UP_ITSELF = ["/mint", "/br/mint", "/airdrop", "/connect", "/onboarding", "/confirm-email"];

const onAny = (pathname: string, prefixes: string[]): boolean => prefixes.some((p) => pathname.startsWith(p));

const withReturnTo = (target: string, pathname: string): string =>
  `${target}?redirect_url=${encodeURIComponent(pathname)}`;

/** A signed-in user whose wallet does not work on this browser yet is sent to onboarding, which finishes it. */
export function resolveOnboardingRedirect({ pathname, status, isDeploying }: OnboardingGateState): string | null {
  if (status === "needs-setup" && !isDeploying && !onAny(pathname, SETS_UP_ITSELF)) {
    return withReturnTo("/onboarding", pathname);
  }
  return null;
}
