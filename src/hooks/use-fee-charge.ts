"use client";

import { useCallback } from "react";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { chargePlatformFee } from "@/lib/charge-fee";

/**
 * Fire-and-forget platform-fee charging. Owns a DEDICATED `useChipiTransaction`
 * instance (its status must never collide with the main action's), so flows
 * stop hand-wiring a second instance + `chargePlatformFee` themselves.
 */
export function useFeeCharge() {
  const { executeTransaction } = useChipiTransaction();
  const chargeFee = useCallback(
    (args: { surface: "marketplace" | "launchpad"; token: string; grossAmount: bigint; pin: string }) => {
      void chargePlatformFee({ ...args, executeTransaction });
    },
    [executeTransaction],
  );
  return { chargeFee };
}
