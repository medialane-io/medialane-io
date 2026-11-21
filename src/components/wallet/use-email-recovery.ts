"use client";

import { useEffect, useState } from "react";
import { describeWalletFailure, detectPasskeySupport, isPasskeyCancelled } from "@medialane/ui";
import type { WalletRecovery } from "@medialane/sdk";
import { computeOwnerGuid, finishSessionRecovery, getEscapeSecurityPeriod, startSessionRecovery } from "@medialane/sdk/starknet";
import { getMedialaneClient } from "@/lib/medialane-client";
import { ownerStore } from "@/lib/wallet/client";
import { createOwnerKey } from "@/lib/wallet/passkey";
import { saveSealedOwner, notifyWalletChange } from "@/lib/wallet/store";

const DAY_SECONDS = 86_400;

const deps = {
  createOwnerKey: () => createOwnerKey(),
  loadRecovery: () => ownerStore.loadRecovery(),
  saveRecovery: (sealed: Parameters<typeof ownerStore.saveRecovery>[0]) => ownerStore.saveRecovery(sealed),
  clearRecovery: () => ownerStore.clearRecovery(),
  saveOwner: (sealed: Parameters<typeof saveSealedOwner>[0]) => {
    saveSealedOwner(sealed);
    notifyWalletChange();
  },
};

const forThisBrowser = (status: WalletRecovery): boolean => {
  const pending = ownerStore.loadRecovery();
  return (
    status.state !== "none" &&
    status.newOwnerGuid !== null &&
    pending !== null &&
    BigInt(status.newOwnerGuid) === BigInt(computeOwnerGuid(pending.ownerPubKey))
  );
};

async function readWaitDays(wallet: string): Promise<number | null> {
  const seconds = await getEscapeSecurityPeriod(getMedialaneClient().provider, wallet);
  const days = Math.round(seconds / DAY_SECONDS);
  return days > 0 ? days : null;
}

export function useEmailRecovery(wallet: string | undefined, onRecovered: () => void) {
  const [status, setStatus] = useState<WalletRecovery | null | undefined>(undefined);
  const [waitDays, setWaitDays] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMedialaneClient().api.account.walletRecovery().then(setStatus).catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    if (!wallet || !status?.enabled) return;
    let cancelled = false;
    readWaitDays(wallet)
      .then((days) => !cancelled && setWaitDays(days))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [wallet, status?.enabled]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(describeWalletFailure(err, isPasskeyCancelled(err) ? await detectPasskeySupport() : "unknown").message);
    } finally {
      setBusy(false);
    }
  };

  const start = () =>
    wallet && run(async () => setStatus(await startSessionRecovery(getMedialaneClient().api, wallet, deps)));
  const finish = () =>
    wallet &&
    run(async () => {
      await finishSessionRecovery(getMedialaneClient().api, wallet, deps);
      onRecovered();
    });

  return {
    status,
    mine: !!status && forThisBrowser(status),
    waitDays,
    busy,
    error,
    start: () => void start(),
    finish: () => void finish(),
  };
}
