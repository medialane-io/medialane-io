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

export function useWalletNativeSession(): WalletNativeSession {

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
