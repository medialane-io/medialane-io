import type { AfterCode } from "@/lib/onboarding/decisions";

export type WalletStatus = "none" | "checking" | "ready" | "needs-setup";

export interface WalletStatusInput {
  sessionLoading: boolean;
  signedIn: boolean;
  sessionHasWallet: boolean;
  keyHere: boolean;
  isDeployed: boolean | null;
  step: AfterCode["type"] | null | undefined;
}

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
