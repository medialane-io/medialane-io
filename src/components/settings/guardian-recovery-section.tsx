"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Shield, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getGuardians, getEscape, cancelEscape, type GuardianInfo, type EscapeInfo } from "@/lib/wallet/guardian";
import { describeGuardianStatus, describeRecoveryAction } from "@/lib/wallet/guardian-status";
import { loadSealedOwner } from "@/lib/wallet/store";
import { friendlyErrorMessage } from "@/lib/friendly-error";
import { AddGuardianDialog } from "./add-guardian-dialog";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function GuardianRecoverySection({ walletAddress }: { walletAddress: string }) {
  const [guardians, setGuardians] = useState<GuardianInfo[] | null>(null);
  const [escape, setEscape] = useState<EscapeInfo | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getGuardians(walletAddress).then(setGuardians).catch(() => setGuardians([]));
    getEscape(walletAddress).then(setEscape).catch(() => setEscape(null));
  }, [walletAddress]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCancel = async () => {
    const sealed = loadSealedOwner();
    if (!sealed) return;
    setCancelBusy(true);
    setCancelError(null);
    try {
      await cancelEscape(sealed);
      refresh();
    } catch (e) {
      setCancelError(friendlyErrorMessage(e));
    } finally {
      setCancelBusy(false);
    }
  };

  const status = guardians ? describeGuardianStatus(guardians) : null;
  const recoveryAction = escape ? describeRecoveryAction(escape) : "none";
  const inProgress = escape?.escapeType === "Owner" && recoveryAction !== "none" ? escape : null;

  const sealed = loadSealedOwner();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Shield className="h-4 w-4" />
          Security &amp; Recovery
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          A guardian can help you recover this wallet if you lose this device.
        </p>
      </div>
      <div className="border-t border-border pt-4 space-y-3">
        {inProgress && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              A guardian has started replacing this wallet&apos;s owner key.{" "}
              {inProgress.status === "Ready"
                ? "It can complete at any time."
                : `It can complete on ${new Date(inProgress.readyAt * 1000).toLocaleString()}.`}{" "}
              If this wasn&apos;t you, cancel it now.
              {cancelError && <p className="mt-1 text-destructive">{cancelError}</p>}
              <Button
                onClick={handleCancel}
                disabled={cancelBusy}
                variant="destructive"
                size="sm"
                className="mt-2 w-full"
              >
                {cancelBusy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Cancel recovery
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm text-foreground">Guardian recovery</p>
            {status === null ? (
              <p className="text-xs text-muted-foreground">Checking…</p>
            ) : status.kind === "none" ? (
              <p className="text-xs text-muted-foreground">Not set up.</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Active: {status.guardian.type} guardian {short(status.guardian.storedValue)}
              </p>
            )}
          </div>
          {status?.kind === "none" && sealed && (
            <Button onClick={() => setAddOpen(true)} variant="outline" size="sm">
              Add guardian
            </Button>
          )}
          {status?.kind === "active" && (
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px]">
              Configured
            </Badge>
          )}
        </div>

        <Link href="/recover" className="block text-xs font-medium text-primary hover:underline">
          Lost this device, or acting as someone&apos;s guardian? Recover a wallet →
        </Link>
      </div>

      {sealed && (
        <AddGuardianDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          sealed={sealed}
          onAdded={refresh}
        />
      )}
    </div>
  );
}
