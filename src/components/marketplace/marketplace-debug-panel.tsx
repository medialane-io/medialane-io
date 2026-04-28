"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Bug } from "lucide-react";
import { toast } from "sonner";
import type { MarketplaceDebugSnapshot } from "@/hooks/use-marketplace";
import { Button } from "@/components/ui/button";

interface MarketplaceDebugPanelProps {
  snapshot: MarketplaceDebugSnapshot | null;
  label?: string;
}

export function MarketplaceDebugPanel({
  snapshot,
  label = "Marketplace debug",
}: MarketplaceDebugPanelProps) {
  const [copied, setCopied] = useState(false);
  const payload = useMemo(() => {
    if (!snapshot) return "";
    return JSON.stringify(snapshot, null, 2);
  }, [snapshot]);

  if (!snapshot) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      toast.success("Debug payload copied");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy debug payload");
    }
  };

  return (
    <details className="rounded-xl border border-dashed border-amber-400/40 bg-amber-400/5 p-3 text-xs">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 font-semibold text-amber-300">
          <Bug className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="rounded-full border border-amber-400/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-200/80">
          {snapshot.step}
        </span>
      </summary>

      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <DebugField label="Operation" value={snapshot.operation} />
          <DebugField label="Standard" value={snapshot.tokenStandard} />
          <DebugField label="Intent" value={snapshot.intentId} />
          <DebugField label="Intent status" value={snapshot.intentStatus} />
          <DebugField label="Tx" value={snapshot.txHash} />
          <DebugField label="Marketplace" value={snapshot.marketplaceContract} />
        </div>

        {snapshot.error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-[11px] text-destructive">
            {snapshot.error}
          </p>
        )}

        <pre className="max-h-52 overflow-auto rounded-lg bg-black/40 p-2 text-[10px] leading-relaxed text-muted-foreground">
          {payload}
        </pre>

        <Button type="button" size="sm" variant="outline" className="h-8 w-full gap-2" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy debug payload"}
        </Button>
      </div>
    </details>
  );
}

function DebugField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  const short = value.length > 22 ? `${value.slice(0, 10)}...${value.slice(-8)}` : value;
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{label}</p>
      <p className="truncate font-mono text-foreground" title={value}>{short}</p>
    </div>
  );
}
