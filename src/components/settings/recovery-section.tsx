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
import { useT } from "@medialane/ui/i18n";
import { useFormat } from "@medialane/ui/i18n";

const READ_ATTEMPTS = 20;
const READ_DELAY_MS = 3000;

export function RecoverySection() {
  const intl = useFormat();
  const t = useT();
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
      title={t("Recovery by email")}
      description={t("A backup key brings this wallet back on any browser through the account email.")}
    >
      {status.state !== "none" && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>{t.rich("{value}{button}", { value: status.state === "ready"
              ? t("Recovery can finish anytime.")
              : t("Recovery finishes on {value}.", { value: intl.date((status.readyAt ?? 0) * 1000, { month: "short", day: "numeric" }) }), button: <Button onClick={cancel} disabled={busy !== null} variant="destructive" size="sm" className="mt-2 w-full">
              {busy === "cancel" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {t("Cancel recovery")}
            </Button> })}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {status.enabled
            ? t("Recovery by email is active.")
            : t("Recovery is off.")}
        </p>
        {status.enabled ? (
          <Badge variant="soft" className="border-emerald-500/40 bg-emerald-500/10 text-2xs text-emerald-600 dark:text-emerald-400">
            {t("On")}
          </Badge>
        ) : (
          <Button onClick={turnOn} disabled={busy !== null || !status.guardianPubkey} variant="soft" size="sm">
            {busy === "on" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {t("Turn on recovery")}
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </AccountSection>
  );
}

const read = () => getMedialaneClient().api.account.walletRecovery();
