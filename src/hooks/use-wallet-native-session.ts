"use client";

import { useEffect, useState } from "react";
import { loadSealedOwner, onWalletChange } from "@/lib/wallet/store";
import { isDeployed as checkIsDeployed } from "@/lib/wallet/account-ops";
import { starknetVenueSigner } from "@/lib/wallet/venue-signer";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";

export interface WalletNativeSession {
  address: string | null;
  hasWallet: boolean;
  isDeployed: boolean | null;
  signer: StarknetVenueSigner | null;
}

/**
 * Wallet-native identity — the MediaWallet equivalent of ChipiPay's
 * useSessionKey, deliberately minimal: address resolution and a signer, no
 * session-key lifecycle.
 */
export function useWalletNativeSession(): WalletNativeSession {
  // localStorage reads are synchronous — resolve address on first render
  // instead of lagging a tick behind via useEffect (which would otherwise
  // flash a false "no wallet" state on every mount).
  const [address, setAddress] = useState<string | null>(() => loadSealedOwner()?.address ?? null);
  const [deployed, setDeployed] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => {
      const sealed = loadSealedOwner();
      setAddress(sealed?.address ?? null);
      if (sealed) {
        checkIsDeployed(sealed.address).then(setDeployed).catch(() => setDeployed(false));
      } else {
        setDeployed(null);
      }
    };
    sync();
    return onWalletChange(sync);
  }, []);

  const sealed = loadSealedOwner();

  return {
    address,
    hasWallet: address !== null,
    isDeployed: deployed,
    signer: sealed ? starknetVenueSigner(sealed) : null,
  };
}
