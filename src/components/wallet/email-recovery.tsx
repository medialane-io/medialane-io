"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { describeError } from "@medialane/ui";
import { Button } from "@medialane/ui/button";
import type { WalletRecovery } from "@medialane/sdk";
import { computeOwnerGuid, finishSessionRecovery, startSessionRecovery } from "@medialane/sdk/starknet";
import { getMedialaneClient } from "@/lib/medialane-client";
import { useSession } from "@/hooks/use-session";
import { ownerStore } from "@/lib/wallet/client";
import { createOwnerKey } from "@/lib/wallet/passkey";
import { saveSealedOwner, notifyWalletChange } from "@/lib/wallet/store";

const deps = {
  createOwnerKey: () => createOwnerKey(),
  loadPending: () => ownerStore.loadPending(),
  savePending: (sealed: Parameters<typeof ownerStore.savePending>[0]) => ownerStore.savePending(sealed),
  clearPending: () => ownerStore.clearPending(),
  saveOwner: (sealed: Parameters<typeof saveSealedOwner>[0]) => {
    saveSealedOwner(sealed);
    notifyWalletChange();
  },
};

const forThisBrowser = (status: WalletRecovery): boolean => {
  const pending = ownerStore.loadPending();
  return (
    status.state !== "none" &&
    status.newOwnerGuid !== null &&
    pending !== null &&
    BigInt(status.newOwnerGuid) === BigInt(computeOwnerGuid(pending.ownerPubKey))
  );
};

export function EmailRecovery({ onRecovered }: { onRecovered: () => void }) {
  const { session } = useSession();
  const [status, setStatus] = useState<WalletRecovery | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMedialaneClient().api.account.walletRecovery().then(setStatus).catch(() => setStatus(null));
  }, []);

  const wallet = session?.walletAddress;
  if (!status?.enabled || !wallet) return null;
  const mine = forThisBrowser(status);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(describeError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const start = () => run(async () => setStatus(await startSessionRecovery(getMedialaneClient().api, wallet, deps)));
  const finish = () =>
    run(async () => {
      await finishSessionRecovery(getMedialaneClient().api, wallet, deps);
      onRecovered();
    });

  return (
    <div className="space-y-3">
      {mine && status.state === "ready" ? (
        <>
          <p className="text-sm text-muted-foreground">Your recovery is ready.</p>
          <Button onClick={finish} disabled={busy} className="w-full">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Open my wallet
          </Button>
        </>
      ) : mine ? (
        <p className="text-sm text-muted-foreground">
          Recovery started. Your wallet opens here on {new Date((status.readyAt ?? 0) * 1000).toLocaleString()}. Sign in
          again then to finish.
        </p>
      ) : (
        <>
          <Button onClick={start} disabled={busy} className="w-full">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Recover with my email
          </Button>
          <p className="text-xs text-muted-foreground">
            Your wallet opens here after a short safety wait, and we email you when it starts.
          </p>
        </>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
