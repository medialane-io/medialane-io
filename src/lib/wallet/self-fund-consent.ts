import type { Call } from "starknet";
import { estimateSelfFundedFee } from "./self-funded";

export interface SelfFundFeeEstimate {
  feeRaw: bigint;
  unit: string;
}

// Imperative, framework-agnostic entry point — the same pattern this app
// already uses for sonner's toast(): a plain function any module can call,
// backed by whichever UI component is currently mounted. Lets non-React
// modules (venue-signer.ts, guardian.ts) request a user decision without
// depending on React themselves.
type Handler = (feeEstimate: Promise<SelfFundFeeEstimate | null>) => Promise<boolean>;
let currentHandler: Handler | null = null;

export function registerSelfFundConsentHandler(handler: Handler | null): void {
  currentHandler = handler;
}

export async function requestSelfFundConsent(address?: string, calls?: Call[]): Promise<boolean> {
  if (!currentHandler) return false;
  const feeEstimate =
    address && calls
      ? estimateSelfFundedFee(address, calls).catch(() => null)
      : Promise.resolve(null);
  return currentHandler(feeEstimate);
}
