"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { describeWalletFailure, detectPasskeySupport, isPasskeyCancelled } from "@medialane/ui";
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

export function EmailRecovery({
  status,
  onStatus,
  onRecovered,
}: {
  status: WalletRecovery;
  onStatus: (status: WalletRecovery) => void;
  onRecovered: () => void;
}) {
  const { session } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wallet = session?.walletAddress;
  if (!wallet) return null;
  const mine = forThisBrowser(status);

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

  const start = () => run(async () => onStatus(await startSessionRecovery(getMedialaneClient().api, wallet, deps)));
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
            Open my account
          </Button>
        </>
      ) : mine ? (
        <p className="text-sm text-muted-foreground">
          Recovery started. Your account opens here on {new Date((status.readyAt ?? 0) * 1000).toLocaleString()}. Sign in
          again then to finish.
        </p>
      ) : (
        <>
          {status.state !== "none" ? (
            <p className="text-sm text-muted-foreground">
              A recovery is already waiting for this account. Starting again here replaces it, and the wait begins
              again.
            </p>
          ) : null}
          <Button onClick={start} disabled={busy} className="w-full">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Recover with my email
          </Button>
          <p className="text-xs text-muted-foreground">
            Your account opens here after a short safety wait, and we email you when it starts.
          </p>
        </>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
