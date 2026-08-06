"use client";

import { use, useState } from "react";
import Link from "next/link";
import { normalizeAddress } from "@medialane/sdk";
import {
  ArrowLeft, Users, Award, Loader2, CheckCircle2, AlertCircle, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FadeIn } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useCollection } from "@/hooks/use-collections";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Call } from "starknet";

// ── Address parsing ───────────────────────────────────────────────────────────

function parseAddresses(raw: string): string[] {
  return raw
    .split(/[\n,\s]+/)
    .map((a) => a.trim())
    .filter((a) => /^0x[0-9a-fA-F]+$/.test(a));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BatchAddSection({
  onAdd,
  isSubmitting,
}: {
  onAdd: (addresses: string[]) => void;
  isSubmitting: boolean;
}) {
  const [raw, setRaw] = useState("");
  const parsed = parseAddresses(raw);
  const overLimit = parsed.length > 100;

  return (
    <div className="bento-cell p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-green-500" />
        <span className="font-semibold text-sm">Add participants</span>
        {parsed.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {parsed.length} address{parsed.length !== 1 ? "es" : ""}
            {overLimit && <span className="text-destructive"> (max 100)</span>}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Only allowlisted addresses can claim their POP credential. Paste up to 100 per batch.
      </p>
      <Textarea
        placeholder={"Paste Starknet addresses, one per line:\n0x04a...\n0x06b..."}
        rows={8}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        className="tabular-nums text-xs resize-none"
      />
      <Button
        size="sm"
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        disabled={parsed.length === 0 || overLimit || isSubmitting}
        onClick={() => {
          onAdd(parsed);
          setRaw("");
        }}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            Adding…
          </>
        ) : (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Add {parsed.length > 0 ? `${parsed.length} participant${parsed.length !== 1 ? "s" : ""}` : "participants"}
          </>
        )}
      </Button>
    </div>
  );
}

function RemoveSection({
  onRemove,
  isSubmitting,
}: {
  onRemove: (address: string) => void;
  isSubmitting: boolean;
}) {
  const [addr, setAddr] = useState("");
  const valid = /^0x[0-9a-fA-F]+$/.test(addr.trim());

  return (
    <div className="bento-cell p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Trash2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold text-sm">Remove participant</span>
      </div>
      <input
        type="text"
        placeholder="0x..."
        value={addr}
        onChange={(e) => setAddr(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm tabular-nums placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <Button
        variant="outline"
        size="sm"
        className="w-full text-destructive hover:text-destructive"
        disabled={!valid || isSubmitting}
        onClick={() => {
          onRemove(addr.trim());
          setAddr("");
        }}
      >
        {isSubmitting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
        ) : (
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
        )}
        Remove address
      </Button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PopManagePage({
  params,
}: {
  params: Promise<{ contract: string }>;
}) {
  const { contract } = use(params);
  const { address: walletAddress, hasWallet, signer } = useWalletNativeSession();
  const { collection, isLoading } = useCollection(contract);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [txResult, setTxResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isOwner =
    walletAddress &&
    collection?.owner &&
    normalizeAddress("STARKNET", walletAddress) === normalizeAddress("STARKNET", collection.owner);

  const execute = async (calls: Call[], successMsg: string) => {
    if (!hasWallet || !signer) return;
    setIsSubmitting(true);
    try {
      await signer.execute(calls);
      setTxResult({ type: "success", message: successMsg });
    } catch (err) {
      setTxResult({ type: "error", message: err instanceof Error ? err.message : "Transaction failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchAdd = (addresses: string[]) => {
    void execute(
      [{
        contractAddress: contract,
        entrypoint: "batch_add_to_allowlist",
        calldata: [addresses.length.toString(), ...addresses],
      }],
      `Added ${addresses.length} participant${addresses.length !== 1 ? "s" : ""} to allowlist`
    );
  };

  const handleRemove = (address: string) => {
    void execute(
      [{ contractAddress: contract, entrypoint: "remove_from_allowlist", calldata: [address] }],
      "Participant removed from allowlist"
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-10 pb-16 space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground/20 mx-auto" />
        <p className="text-muted-foreground">Collection not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/launchpad/pop">← Back</Link>
        </Button>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <Award className="h-10 w-10 text-muted-foreground/20 mx-auto" />
        <p className="text-muted-foreground">You are not the organizer of this event.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/launchpad/pop">← Back to events</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-10 pb-16 space-y-6">
      <FadeIn>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/launchpad/pop">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            All events
          </Link>
        </Button>
      </FadeIn>

      <FadeIn delay={0.04}>
        <div>
          <span className="pill-badge inline-flex gap-1.5 mb-2">
            <Award className="h-3 w-3" />
            Organizer
          </span>
          <h1 className="text-2xl font-bold mt-1">Manage Event</h1>
          <p className="text-sm text-muted-foreground">
            {collection.name ?? contract}
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.08}>
        <div className="bento-cell p-4 flex items-center gap-3">
          <Award className="h-4 w-4 text-green-500 shrink-0" />
          <p className="text-xs text-muted-foreground">
            POP credentials are <strong className="text-foreground">always allowlist-gated</strong> —
            only participants you add below can claim their soulbound credential.
          </p>
        </div>
      </FadeIn>

      {/* Batch add */}
      <FadeIn delay={0.12}>
        <BatchAddSection onAdd={handleBatchAdd} isSubmitting={isSubmitting} />
      </FadeIn>

      {/* Remove single */}
      <FadeIn delay={0.16}>
        <RemoveSection onRemove={handleRemove} isSubmitting={isSubmitting} />
      </FadeIn>


      {/* Tx feedback dialog — opens while the on-chain operation is pending
          (processing) and stays open through the success/error outcome.
          Previously this dialog only opened AFTER the tx settled, so during
          the 10–20s waiting window the user saw nothing but a spinning
          button. Driving it off `isSubmitting || txResult` gives the user
          unambiguous "tx in progress" feedback the moment PIN is submitted. */}
      <Dialog
        open={isSubmitting || !!txResult}
        onOpenChange={(v) => {
          // Cannot dismiss while in-flight — same UX as the marketplace dialogs.
          if (!v && !isSubmitting) setTxResult(null);
        }}
      >
        <DialogContent className="max-w-[calc(100%-12px)] sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {isSubmitting
                ? "Confirming on Starknet…"
                : txResult?.type === "success"
                ? "Done"
                : "Transaction failed"}
            </DialogTitle>
            {!isSubmitting && txResult?.type === "error" && (
              <DialogDescription>Review the error below and try again.</DialogDescription>
            )}
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {isSubmitting ? (
              <>
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-sm text-center text-muted-foreground">
                  Please wait, do not close this window. This usually takes 10–20 seconds.
                </p>
              </>
            ) : txResult?.type === "success" ? (
              <>
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                <p className="text-sm text-center text-muted-foreground">{txResult.message}</p>
                <Button className="w-full" onClick={() => setTxResult(null)}>Done</Button>
              </>
            ) : (
              <>
                <AlertCircle className="h-10 w-10 text-destructive" />
                <p className="text-sm text-center text-muted-foreground">{txResult?.message}</p>
                <Button variant="outline" className="w-full" onClick={() => setTxResult(null)}>Dismiss</Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
