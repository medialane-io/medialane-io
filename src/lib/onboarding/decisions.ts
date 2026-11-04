import { normalizeWalletAddress } from "@medialane/sdk/starknet";
import { z } from "zod";

export type AfterEmailCheck = "send-code" | "register";
export type AfterRegister = "wallet-setup" | "send-code";
export type AfterCode =
  | { type: "finish" }
  | { type: "wallet-setup" }
  | { type: "key-setup"; walletAddress: string }
  | { type: "restore-key"; walletAddress: string };

export const isEmailAddress = (value: string): boolean => z.string().email().safeParse(value).success;

export const afterEmailCheck = (exists: boolean): AfterEmailCheck => (exists ? "send-code" : "register");

export const afterRegister = (outcome: "created" | "already-exists"): AfterRegister =>
  outcome === "created" ? "wallet-setup" : "send-code";

/** Where a signed-in user goes next. Their wallet is ready on this browser only when its setup is finished and this browser's key is on it. */
export function walletStep(
  wallet: { walletAddress: string; needsKeySetup: boolean } | null,
  localOwner: { address: string; onWallet: boolean } | null,
): AfterCode {
  if (!wallet) return { type: "wallet-setup" };
  if (wallet.needsKeySetup) return { type: "key-setup", walletAddress: wallet.walletAddress };
  const readyHere =
    localOwner !== null &&
    localOwner.onWallet &&
    normalizeWalletAddress(localOwner.address) === normalizeWalletAddress(wallet.walletAddress);
  return readyHere ? { type: "finish" } : { type: "restore-key", walletAddress: wallet.walletAddress };
}
