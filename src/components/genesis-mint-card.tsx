"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { GradientButton } from "@medialane/ui";
import { Button } from "@medialane/ui/button";
import { Sparkles, ExternalLink, CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useGenesisMint, type GenesisMintMessages } from "@/hooks/use-genesis-mint";
import { EXPLORER_URL, MINT_CONTRACT } from "@/lib/constants";

export interface GenesisMintCopy extends GenesisMintMessages {
  ready: string;
  claim: string;
  claimUnavailable: string;
  working: string;
  wait: string;
  steps: readonly [string, string, string];
  successTitle: string;
  successBody: string;
  create: string;
  explore: string;
  again: string;
  failedTitle: string;
  retry: string;
}

interface GenesisMintCardProps {
  copy: GenesisMintCopy;
  storageKeyPrefix: string;
  signedOut: ReactNode;
}

export function GenesisMintCard({ copy, storageKeyPrefix, signedOut }: GenesisMintCardProps) {
  const { hasWallet, address, isDeployed } = useWalletNativeSession();
  const { step, error, statusMsg, txHash, phase, start, retry, resetStored } = useGenesisMint({
    address: address ?? null,
    storageKey: address ? `${storageKeyPrefix}${address}` : null,
    messages: copy,
  });

  if (!hasWallet || isDeployed === null) return <>{signedOut}</>;

  const done = [phase !== "idle", phase === "confirming" || phase === "success", phase === "success"];

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-4 shadow-lg shadow-black/5">
      {step === "ready" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{copy.ready}</span>
          </div>
          <GradientButton big onClick={start} disabled={!MINT_CONTRACT}>
            <Sparkles className="h-4 w-4" />
            {MINT_CONTRACT ? copy.claim : copy.claimUnavailable}
          </GradientButton>
        </div>
      )}

      {step === "minting" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary shrink-0" />
            <div>
              <p className="font-semibold text-sm">{copy.working}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{statusMsg || copy.wait}</p>
            </div>
          </div>
          <div className="space-y-1.5 pl-9">
            {copy.steps.map((label, i) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                {done[i] ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />}
                <span className={done[i] ? "text-foreground" : ""}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="font-bold text-emerald-600 dark:text-emerald-300">{copy.successTitle}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{copy.successBody}</p>
            </div>
          </div>
          {txHash && (
            <a
              href={`${EXPLORER_URL}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="tabular-nums">{txHash.slice(0, 12)}…{txHash.slice(-8)}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button size="sm" asChild className="flex-1">
              <Link href="/launchpad/single-editions">{copy.create}</Link>
            </Button>
            <Button size="sm" variant="outline" asChild className="flex-1">
              <Link href="/marketplace">{copy.explore}</Link>
            </Button>
          </div>
          <button className="text-xs text-muted-foreground underline underline-offset-2 w-full text-center" onClick={resetStored}>
            {copy.again}
          </button>
        </div>
      )}

      {step === "error" && (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">{copy.failedTitle}</p>
              {error && <p className="text-xs text-muted-foreground mt-0.5">{error}</p>}
            </div>
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={retry}>
            <RefreshCw className="h-3.5 w-3.5" /> {copy.retry}
          </Button>
        </div>
      )}
    </div>
  );
}
