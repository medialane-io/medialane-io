"use client";

import { useCallback, useEffect, useState } from "react";
import { MINT_CONTRACT } from "@/lib/constants";
import { getMedialaneClient } from "@/lib/medialane-client";
import { readGenesisHolding, type GenesisHolding } from "@/lib/genesis-holding";

const NOT_HOLDING: GenesisHolding = { owned: false, tokenId: null };

export function useGenesisHolding(address: string | null) {
  const [holding, setHolding] = useState<GenesisHolding | null>(null);
  const [round, setRound] = useState(0);
  const enabled = Boolean(address && MINT_CONTRACT);

  useEffect(() => {
    if (!enabled || !address) {
      setHolding(null);
      return;
    }
    let current = true;
    readGenesisHolding(getMedialaneClient().provider, MINT_CONTRACT, address)
      .then((read) => current && setHolding(read))
      .catch(() => current && setHolding(NOT_HOLDING));
    return () => {
      current = false;
    };
  }, [address, enabled, round]);

  const reload = useCallback(() => setRound((r) => r + 1), []);

  return { holding, checking: enabled && holding === null, reload };
}
