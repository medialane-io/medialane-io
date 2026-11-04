import type { AfterCode } from "@/lib/onboarding/decisions";

/**
 * none: no wallet to check on this browser: nobody is signed in, or the account's key is on another browser.
 * checking: not known yet.
 * ready: this browser's key is on the account's deployed wallet and its setup is finished.
 * needs-setup: anything else; onboarding finishes it.
 */
export type WalletStatus = "none" | "checking" | "ready" | "needs-setup";

export interface WalletStatusInput {
  sessionLoading: boolean;
  signedIn: boolean;
  sessionHasWallet: boolean;
  keyHere: boolean;
  isDeployed: boolean | null;
  /** The wallet check's answer: undefined while it runs, null when it could not be made. */
  step: AfterCode["type"] | null | undefined;
}

/** True when the wallet check found this browser's key cannot sign for the wallet yet. */
export const keyNotUsable = (step: WalletStatusInput["step"]): boolean => step === "key-setup" || step === "restore-key";

export function walletStatus(input: WalletStatusInput): WalletStatus {
  if (input.sessionLoading) return "checking";
  if (!input.signedIn) return "none";
  if (!input.sessionHasWallet) return "needs-setup";
  if (!input.keyHere) return "none";
  if (input.isDeployed === false) return "needs-setup";
  if (input.isDeployed === null || input.step === undefined) return "checking";
  return keyNotUsable(input.step) ? "needs-setup" : "ready";
}
