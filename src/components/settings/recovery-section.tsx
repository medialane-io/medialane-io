"use client";

import { useCallback, useEffect, useState } from "react";
import { LifeBuoy, Loader2, ShieldAlert } from "lucide-react";
import { AccountSection, describeError } from "@medialane/ui";
import { Alert, AlertDescription } from "@medialane/ui/alert";
import { Badge } from "@medialane/ui/badge";
import { Button } from "@medialane/ui/button";
import { turnOnRecovery } from "@medialane/sdk/starknet";
import { getMedialaneClient } from "@/lib/medialane-client";
import { mediaWallet } from "@/lib/wallet/client";
import { loadSealedOwner } from "@/lib/wallet/store";

const READ_ATTEMPTS = 20;
const READ_DELAY_MS = 3000;

export function RecoverySection() {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof read>> | null>(null);
  const [busy, setBusy] = useState<"on" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => read().then(setStatus).catch(() => setStatus(null)), []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = async (kind: "on" | "cancel", action: () => Promise<void>) => {
    const sealed = loadSealedOwner();
    if (!sealed) return;
    setBusy(kind);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(describeError(err).message);
    } finally {
      setBusy(null);
    }
  };

  const turnOn = () =>
    run("on", async () => {
      await turnOnRecovery(getMedialaneClient().api, mediaWallet, loadSealedOwner()!);
      for (let attempt = 0; attempt < READ_ATTEMPTS; attempt++) {
        const next = await read();
        setStatus(next);
        if (next.enabled) return;
        await new Promise((resolve) => setTimeout(resolve, READ_DELAY_MS));
      }
    });

  const cancel = () =>
    run("cancel", async () => {
      await mediaWallet.cancelEscape(loadSealedOwner()!);
      await refresh();
    });

  if (!status) return null;

  return (
    <AccountSection
      icon={LifeBuoy}
      iconColor="text-emerald-600 dark:text-emerald-400"
      iconBg="bg-emerald-500/10"
      title="Recovery by email"
      description="Get your wallet back on a new browser with just your email."
    >
      {status.state !== "none" && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            A recovery has started for your wallet.{" "}
            {status.state === "ready"
              ? "It can finish at any time."
              : `It can finish on ${new Date((status.readyAt ?? 0) * 1000).toLocaleString()}.`}{" "}
            If this wasn&apos;t you, cancel it now.
            <Button onClick={cancel} disabled={busy !== null} variant="destructive" size="sm" className="mt-2 w-full">
              {busy === "cancel" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Cancel recovery
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {status.enabled
            ? "Recovery is on. If you lose this browser, sign in with your email on a new one to get your wallet back."
            : "Recovery is off."}
        </p>
        {status.enabled ? (
          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-2xs text-emerald-600 dark:text-emerald-400">
            On
          </Badge>
        ) : (
          <Button onClick={turnOn} disabled={busy !== null || !status.guardianPubkey} variant="outline" size="sm">
            {busy === "on" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Turn on recovery
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </AccountSection>
  );
}

const read = () => getMedialaneClient().api.account.walletRecovery();
