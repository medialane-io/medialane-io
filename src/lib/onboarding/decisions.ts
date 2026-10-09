import { normalizeWalletAddress } from "@medialane/sdk/starknet";

export type AfterEmailCheck = "send-code" | "register";
export type AfterRegister = "wallet-setup" | "send-code";
export type AfterCode =
  | { type: "finish" }
  | { type: "wallet-setup" }
  | { type: "key-setup"; walletAddress: string }
  | { type: "link-device"; walletAddress: string };

export const afterEmailCheck = (exists: boolean): AfterEmailCheck => (exists ? "send-code" : "register");

export const afterRegister = (outcome: "created" | "already-exists"): AfterRegister =>
  outcome === "created" ? "wallet-setup" : "send-code";

export function afterCodeVerified(
  wallet: { walletAddress: string; needsKeySetup: boolean } | null,
  localOwnerAddress: string | null,
): AfterCode {
  if (!wallet) return { type: "wallet-setup" };
  if (wallet.needsKeySetup) return { type: "key-setup", walletAddress: wallet.walletAddress };
  const ownedHere =
    localOwnerAddress !== null &&
    normalizeWalletAddress(localOwnerAddress) === normalizeWalletAddress(wallet.walletAddress);
  return ownedHere ? { type: "finish" } : { type: "link-device", walletAddress: wallet.walletAddress };
}
