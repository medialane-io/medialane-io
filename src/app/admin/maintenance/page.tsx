"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, Activity, Database, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL!;
const ADMIN_KEY   = process.env.NEXT_PUBLIC_ADMIN_API_KEY!;

function adminPost(path: string) {
  return fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: { "x-api-key": ADMIN_KEY },
  });
}

export default function AdminMaintenancePage() {
  const [health, setHealth]                   = useState<any>(null);
  const [healthLoading, setHealthLoading]     = useState(true);
  const [registryRunning, setRegistryRunning] = useState(false);
  const [registryResult, setRegistryResult]   = useState<{ inserted: number; skipped: number } | null>(null);
  const [metaRunning, setMetaRunning]         = useState(false);
  const [metaResult, setMetaResult]           = useState<{ enqueued: number } | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/health`, { cache: "no-store" });
      setHealth(await res.json());
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Fetch on mount + every 10s
  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, 10000);
    return () => clearInterval(id);
  }, [fetchHealth]);

  async function handleBackfillRegistry() {
    if (!confirm("Scan all CollectionCreated events on-chain and upsert missing collections. This may take a minute. Continue?")) return;
    setRegistryRunning(true);
    setRegistryResult(null);
    try {
      const res = await adminPost("/admin/collections/backfill-registry");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRegistryResult(data.data);
      toast.success(`Registry backfill complete — ${data.data.inserted} inserted, ${data.data.skipped} skipped`);
    } catch { toast.error("Backfill registry failed"); }
    finally { setRegistryRunning(false); }
  }

  async function handleBackfillMetadata() {
    if (!confirm("Re-queue PENDING/FAILED collections for metadata fetch. Continue?")) return;
    setMetaRunning(true);
    setMetaResult(null);
    try {
      const res = await adminPost("/admin/collections/backfill-metadata");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMetaResult(data.data);
      toast.success(`Metadata backfill complete — ${data.data.enqueued} jobs enqueued`);
    } catch { toast.error("Backfill metadata failed"); }
    finally { setMetaRunning(false); }
  }

  const lagBlocks = health?.indexer?.lagBlocks ?? null;
  const lagColor = lagBlocks === null ? "text-muted-foreground"
    : lagBlocks > 100 ? "text-destructive"
    : lagBlocks > 20  ? "text-yellow-500"
    : "text-green-500";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Maintenance</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform health and one-click maintenance operations.</p>
      </div>

      {/* Indexer health */}
      <div className="glass rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Indexer Health</h2>
          </div>
          <button
            onClick={fetchHealth}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", healthLoading && "animate-spin")} />
          </button>
        </div>

        {healthLoading && !health ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !health ? (
          <p className="text-sm text-destructive">Health check failed</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Status",     value: health.status,                    color: health.status === "ok" ? "text-green-500" : "text-destructive" },
              { label: "Database",   value: health.database,                  color: health.database === "ok" ? "text-green-500" : "text-destructive" },
              { label: "Last block", value: health.indexer?.lastBlock ?? "—", color: "text-foreground" },
              { label: "Lag",        value: lagBlocks !== null ? `${lagBlocks} blocks` : "—", color: lagColor },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{item.label}</p>
                <p className={`font-semibold font-mono text-sm ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">Auto-refreshes every 10 seconds.</p>
      </div>

      {/* Operations */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Operations</h2>

        {/* Backfill Registry */}
        <div className="glass rounded-xl p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Database className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Backfill Registry</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Scans all <code>CollectionCreated</code> events on-chain and upserts any collections missing from the database.
                Run this when collections were created but never indexed.
              </p>
              {registryResult && (
                <p className="text-xs text-green-500 mt-1 font-medium">
                  ✓ {registryResult.inserted} inserted, {registryResult.skipped} skipped
                </p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBackfillRegistry}
            disabled={registryRunning}
            className="shrink-0"
          >
            {registryRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Run"}
          </Button>
        </div>

        {/* Backfill Metadata */}
        <div className="glass rounded-xl p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Zap className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Backfill Metadata</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Re-enqueues <code>COLLECTION_METADATA_FETCH</code> jobs for all collections that are
                PENDING, FAILED, missing a name, or missing an owner. Run when collection images are missing.
              </p>
              {metaResult && (
                <p className="text-xs text-green-500 mt-1 font-medium">
                  ✓ {metaResult.enqueued} jobs enqueued
                </p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBackfillMetadata}
            disabled={metaRunning}
            className="shrink-0"
          >
            {metaRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Run"}
          </Button>
        </div>
      </div>
    </div>
  );
}
