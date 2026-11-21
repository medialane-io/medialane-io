import { mutate } from "swr";
import { normalizeWalletAddress } from "@medialane/sdk/starknet";
import { getMedialaneClient } from "@/lib/medialane-client";
import { walletStep, type AfterCode } from "@/lib/onboarding/decisions";
import { isOwnerOf } from "@/lib/wallet/devices";
import { loadSealedOwner } from "@/lib/wallet/store";

export const WALLET_STEP_KEY = "wallet-step";

export async function checkWalletStep(): Promise<AfterCode> {
  const wallet = await getMedialaneClient().api.account.sessionWallet();
  const local = loadSealedOwner();
  if (!wallet || !local) return walletStep(wallet, local ? { address: local.address, onWallet: false } : null);
  const forThisWallet = normalizeWalletAddress(local.address) === normalizeWalletAddress(wallet.walletAddress);
  const onWallet = forThisWallet && !wallet.needsKeySetup ? await isOwnerOf(wallet.walletAddress, local.ownerPubKey) : false;
  return walletStep(wallet, { address: local.address, onWallet });
}

export const refreshWalletStep = () =>
  mutate((key) => Array.isArray(key) && key[0] === WALLET_STEP_KEY, undefined, { revalidate: true });
