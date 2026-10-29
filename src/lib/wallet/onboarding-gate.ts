export interface OnboardingGateState {
  pathname: string;
  hasWallet: boolean;
  isDeployed: boolean | null;
  isDeploying: boolean;
}

const SETS_UP_ITSELF = ["/mint", "/br/mint", "/airdrop", "/connect", "/onboarding", "/confirm-email"];

const onAny = (pathname: string, prefixes: string[]): boolean => prefixes.some((p) => pathname.startsWith(p));

const withReturnTo = (target: string, pathname: string): string =>
  `${target}?redirect_url=${encodeURIComponent(pathname)}`;

export function resolveOnboardingRedirect(state: OnboardingGateState): string | null {
  const { pathname, hasWallet, isDeployed, isDeploying } = state;
  if (hasWallet && isDeployed === false && !isDeploying && !onAny(pathname, SETS_UP_ITSELF)) {
    return withReturnTo("/onboarding", pathname);
  }
  return null;
}
