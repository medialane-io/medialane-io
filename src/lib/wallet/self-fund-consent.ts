// Imperative, framework-agnostic entry point — the same pattern this app
// already uses for sonner's toast(): a plain function any module can call,
// backed by whichever UI component is currently mounted. Lets non-React
// modules (venue-signer.ts, guardian.ts) request a user decision without
// depending on React themselves.
let currentHandler: (() => Promise<boolean>) | null = null;

export function registerSelfFundConsentHandler(handler: (() => Promise<boolean>) | null): void {
  currentHandler = handler;
}

export async function requestSelfFundConsent(): Promise<boolean> {
  if (!currentHandler) return false;
  return currentHandler();
}
