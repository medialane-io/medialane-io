"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { normalizeWalletAddress } from "@medialane/sdk/starknet";
import { loadSealedOwner, onWalletChange } from "@/lib/wallet/store";
import { isDeployed as checkIsDeployed } from "@/lib/wallet/account-ops";
import { starknetVenueSigner } from "@/lib/wallet/venue-signer";
import { checkWalletStep, WALLET_STEP_KEY } from "@/lib/wallet/wallet-step";
import { keyNotUsable, walletStatus, type WalletStatus } from "@/lib/wallet/wallet-status";
import { useSession } from "@medialane/ui/utils/use-session";
import type { SealedOwner } from "@/lib/wallet/passkey";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";

export interface WalletNativeSession {
  /** The wallet this browser can sign for; null when it cannot. */
  address: string | null;
  /** This browser holds a key for the account's wallet that the wallet has not refused. */
  hasWallet: boolean;
  isDeployed: boolean | null;
  signer: StarknetVenueSigner | null;
  status: WalletStatus;
}

function sessionOwner(sealed: SealedOwner | null, sessionWallet: string | null | undefined): SealedOwner | null {
  if (!sealed || !sessionWallet) return null;
  return normalizeWalletAddress(sealed.address) === normalizeWalletAddress(sessionWallet) ? sealed : null;
}

export function useWalletNativeSession(): WalletNativeSession {
  const { session, isLoading } = useSession();
  const [stored, setStored] = useState<SealedOwner | null>(() => loadSealedOwner());
  const [deployed, setDeployed] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setStored(loadSealedOwner());
    sync();
    return onWalletChange(sync);
  }, []);

  const sealed = sessionOwner(stored, session?.walletAddress);

  useEffect(() => {
    if (!sealed) {
      setDeployed(null);
      return;
    }
    checkIsDeployed(sealed.address).then(setDeployed).catch(() => setDeployed(null));
  }, [sealed]);

  const checkKey = sealed && deployed === true ? [WALLET_STEP_KEY, sealed.address, sealed.ownerPubKey] : null;
  const check = useSWR(checkKey, () => checkWalletStep(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  });
  const step = checkKey === null ? undefined : check.error ? null : check.data?.type;

  const usable = sealed !== null && !keyNotUsable(step) ? sealed : null;
  const signer = useMemo(() => (usable ? starknetVenueSigner(usable) : null), [usable]);

  return {
    address: usable?.address ?? null,
    hasWallet: usable !== null,
    isDeployed: deployed,
    signer,
    status: walletStatus({
      sessionLoading: isLoading,
      signedIn: session !== null,
      sessionHasWallet: !!session?.walletAddress,
      keyHere: sealed !== null,
      isDeployed: deployed,
      step,
    }),
  };
}
