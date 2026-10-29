"use client";

import { useEffect, useState } from "react";
import { getOwners } from "@/lib/wallet/devices";
import { mediaWallet } from "@/lib/wallet/client";

export function useSecurityStatus(address: string | null) {
  const [devices, setDevices] = useState<number | null>(null);
  const [guardians, setGuardians] = useState<number | null>(null);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    getOwners(address)
      .then((owners) => !cancelled && setDevices(owners.length))
      .catch(() => {});
    mediaWallet
      .getGuardians(address)
      .then((list) => !cancelled && setGuardians(list.length))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [address]);

  return { devices, guardians };
}
