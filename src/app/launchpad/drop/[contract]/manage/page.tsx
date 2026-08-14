"use client";

import { use, useState } from "react";
import Link from "next/link";
import { normalizeAddress } from "@medialane/sdk";
import {
  ArrowLeft, Users, ShieldCheck, ShieldOff, DollarSign,
  Loader2, CheckCircle2, AlertCircle, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FadeIn } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useDropInfo, useOnChainDropState } from "@/hooks/use-drops";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { parseAddresses, batchAllowlistCalldata } from "../../drop-allowlist";
import type { Call } from "starknet";
import { friendlyErrorMessage } from "@/lib/friendly-error";

function AllowlistToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bento-cell p-5 space-y-4">
      <div className="flex items-center gap-2">
        {enabled ? (
          <ShieldCheck className="h-4 w-4 text-brand-orange" />
        ) : (
          <ShieldOff className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="font-semibold text-sm">Mint mode</span>
        <span
          className={cn(
            "ml-auto text-xs font-bold uppercase tracking-widest rounded-full px-2.5 py-0.5",
            enabled
              ? "text-brand-orange bg-brand-orange/10"
              : "text-green-400 bg-green-500/10"
          )}
        >
          {enabled ? "Allowlist only" : "Open mint"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {enabled
          ? "Only addresses you add below can mint from this drop."
          : "Anyone can mint from this drop. Enable allowlist mode to restrict access."}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="w-full"
      >
        {enabled ? "Switch to open mint" : "Enable allowlist"}
      </Button>
    </div>
  );
}

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
        <Users className="h-4 w-4 text-brand-orange" />
        <span className="font-semibold text-sm">Add to allowlist</span>
        {parsed.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {parsed.length} address{parsed.length !== 1 ? "es" : ""}
            {overLimit && <span className="text-destructive"> (max 100)</span>}
          </span>
        )}
      </div>
      <Textarea
        placeholder={"Paste Starknet addresses, one per line:\n0x04a...\n0x06b..."}
        rows={6}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        className="tabular-nums text-xs resize-none"
      />
      <Button
        size="sm"
        className="w-full bg-brand-orange hover:brightness-110 text-white"
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
            Add {parsed.length > 0 ? `${parsed.length} address${parsed.length !== 1 ? "es" : ""}` : "addresses"}
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
        <span className="font-semibold text-sm">Remove from allowlist</span>
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

export default function DropManagePage({
  params,
}: {
  params: Promise<{ contract: string }>;
}) {
  const { contract } = use(params);
  const { address: walletAddress, hasWallet, signer } = useWalletNativeSession();
  const { dropInfo, isLoading: dropLoading } = useDropInfo(contract);
  const { state: dropState, isLoading: dropStateLoading, mutate: mutateDropState } = useOnChainDropState(contract);
  const allowlistEnabled = dropState?.allowlistEnabled;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [txResult, setTxResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isOwner =
    walletAddress &&
    dropInfo?.owner &&
    normalizeAddress("STARKNET", walletAddress) === normalizeAddress("STARKNET", dropInfo.owner);

  const isLoading = dropLoading || dropStateLoading;

  const execute = async (calls: Call[], successMsg: string) => {
    if (!hasWallet || !signer) return;
    setIsSubmitting(true);
    try {
      await signer.execute(calls);
      setTxResult({ type: "success", message: successMsg });
      mutateDropState();
    } catch (err) {
      setTxResult({ type: "error", message: friendlyErrorMessage(err, "Transaction failed") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAllowlist = () => {
    const enabling = !allowlistEnabled;
    void execute(
      [{ contractAddress: contract, entrypoint: "set_allowlist_enabled", calldata: [enabling ? "1" : "0"] }],
      enabling ? "Allowlist mode enabled" : "Switched to open mint"
    );
  };

  const handleBatchAdd = (addresses: string[]) => {
    void execute(
      [{ contractAddress: contract, entrypoint: "batch_add_to_allowlist", calldata: batchAllowlistCalldata(addresses) }],
      `Added ${addresses.length} address${addresses.length !== 1 ? "es" : ""} to allowlist`
    );
  };

  const handleRemove = (address: string) => {
    void execute(
      [{ contractAddress: contract, entrypoint: "remove_from_allowlist", calldata: [address] }],
      "Address removed from allowlist"
    );
  };

  const handleWithdraw = () => {
    void execute(
      [{ contractAddress: contract, entrypoint: "withdraw_payments", calldata: [] }],
      "Payments withdrawn to your account"
    );
  };

  const isPaidDrop =
    !!dropState?.conditions &&
    dropState.conditions.price !== "0" &&
    dropState.conditions.paymentToken !== "0x0";

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-10 pb-16 space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!dropInfo) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground/20 mx-auto" />
        <p className="text-muted-foreground">Drop not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/launchpad/drop">← Back</Link>
        </Button>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <ShieldCheck className="h-10 w-10 text-muted-foreground/20 mx-auto" />
        <p className="text-muted-foreground">You are not the organizer of this drop.</p>
        <Button asChild variant="outline" size="sm">
          <Link href={`/launchpad/drop/${contract}`}>← Back to drop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-10 pb-16 space-y-6">
      <FadeIn>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/launchpad/drop/${contract}`}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            {dropInfo.name ?? "Drop"}
          </Link>
        </Button>
      </FadeIn>

      <FadeIn delay={0.04}>
        <div>
          <span className="pill-badge inline-flex gap-1.5 mb-2">
            <ShieldCheck className="h-3 w-3" />
            Organizer
          </span>
          <h1 className="text-2xl font-bold mt-1">Manage Drop</h1>
          <p className="text-sm text-muted-foreground">
            {dropInfo.name ?? contract}
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.08}>
        <AllowlistToggle
          enabled={allowlistEnabled ?? false}
          onToggle={handleToggleAllowlist}
        />
      </FadeIn>

      <FadeIn delay={0.12}>
        <BatchAddSection onAdd={handleBatchAdd} isSubmitting={isSubmitting} />
      </FadeIn>

      <FadeIn delay={0.16}>
        <RemoveSection onRemove={handleRemove} isSubmitting={isSubmitting} />
      </FadeIn>

      {isPaidDrop && (
        <FadeIn delay={0.2}>
          <div className="bento-cell p-5 space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-brand-orange" />
              <span className="font-semibold text-sm">Withdraw payments</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Pull all ERC-20 revenue collected by this drop to your wallet.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleWithdraw}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <DollarSign className="h-3.5 w-3.5 mr-1.5" />
              )}
              Withdraw
            </Button>
          </div>
        </FadeIn>
      )}

      <Dialog
        open={isSubmitting || !!txResult}
        onOpenChange={(v) => {
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
