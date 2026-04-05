"use client";

import { use, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowLeft, Users, ShieldCheck, ShieldOff, DollarSign,
  Loader2, CheckCircle2, AlertCircle, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FadeIn } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { useDropInfo } from "@/hooks/use-drops";
import { starknetProvider } from "@/lib/starknet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── On-chain reads ────────────────────────────────────────────────────────────

function useAllowlistEnabled(contract: string) {
  return useSWR<boolean>(
    `allowlist-enabled-${contract}`,
    async () => {
      const res = await starknetProvider.callContract({
        contractAddress: contract,
        entrypoint: "is_allowlist_enabled",
        calldata: [],
      });
      return res[0] !== "0x0";
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
}

// ── Address parsing ───────────────────────────────────────────────────────────

function parseAddresses(raw: string): string[] {
  return raw
    .split(/[\n,\s]+/)
    .map((a) => a.trim())
    .filter((a) => /^0x[0-9a-fA-F]+$/.test(a));
}

// ── Calldata helpers ──────────────────────────────────────────────────────────

function batchAllowlistCalldata(addresses: string[]): string[] {
  return [addresses.length.toString(), ...addresses];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AllowlistToggle({
  contract,
  enabled,
  onToggle,
}: {
  contract: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bento-cell p-5 space-y-4">
      <div className="flex items-center gap-2">
        {enabled ? (
          <ShieldCheck className="h-4 w-4 text-orange-500" />
        ) : (
          <ShieldOff className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="font-semibold text-sm">Mint mode</span>
        <span
          className={cn(
            "ml-auto text-xs font-bold uppercase tracking-widest rounded-full px-2.5 py-0.5",
            enabled
              ? "text-orange-400 bg-orange-500/10"
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
        <Users className="h-4 w-4 text-orange-500" />
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
        className="font-mono text-xs resize-none"
      />
      <Button
        size="sm"
        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
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
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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

export default function DropManagePage({
  params,
}: {
  params: Promise<{ contract: string }>;
}) {
  const { contract } = use(params);
  const { walletAddress, hasWallet } = useSessionKey();
  const { dropInfo, isLoading: dropLoading } = useDropInfo(contract);
  const {
    data: allowlistEnabled,
    isLoading: allowlistLoading,
    mutate: mutateAllowlist,
  } = useAllowlistEnabled(contract);
  const { executeTransaction, isSubmitting } = useChipiTransaction();

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingCall, setPendingCall] = useState<{
    calls: Array<{ contractAddress: string; entrypoint: string; calldata: string[] }>;
    successMsg: string;
  } | null>(null);

  const isOwner =
    walletAddress &&
    dropInfo?.owner &&
    walletAddress.toLowerCase() === dropInfo.owner.toLowerCase();

  const isLoading = dropLoading || allowlistLoading;

  const execute = (
    calls: Array<{ contractAddress: string; entrypoint: string; calldata: string[] }>,
    successMsg: string
  ) => {
    if (!hasWallet) { setWalletSetupOpen(true); return; }
    setPendingCall({ calls, successMsg });
    setPinOpen(true);
  };

  const handlePinSubmit = async (pin: string) => {
    if (!pendingCall) return;
    setPinOpen(false);
    const { calls, successMsg } = pendingCall;
    setPendingCall(null);
    try {
      const result = await executeTransaction({
        pin,
        contractAddress: contract,
        calls,
      });
      if (result.status === "confirmed") {
        toast.success(successMsg);
        mutateAllowlist();
      } else {
        toast.error(result.revertReason ?? "Transaction reverted");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transaction failed");
    }
  };

  const handleToggleAllowlist = () => {
    const enabling = !allowlistEnabled;
    execute(
      [{ contractAddress: contract, entrypoint: "set_allowlist_enabled", calldata: [enabling ? "1" : "0"] }],
      enabling ? "Allowlist mode enabled" : "Switched to open mint"
    );
  };

  const handleBatchAdd = (addresses: string[]) => {
    execute(
      [{ contractAddress: contract, entrypoint: "batch_add_to_allowlist", calldata: batchAllowlistCalldata(addresses) }],
      `Added ${addresses.length} address${addresses.length !== 1 ? "es" : ""} to allowlist`
    );
  };

  const handleRemove = (address: string) => {
    execute(
      [{ contractAddress: contract, entrypoint: "remove_from_allowlist", calldata: [address] }],
      "Address removed from allowlist"
    );
  };

  const handleWithdraw = () => {
    execute(
      [{ contractAddress: contract, entrypoint: "withdraw_payments", calldata: [] }],
      "Payments withdrawn to your wallet"
    );
  };

  const isPaidDrop =
    dropInfo?.conditions &&
    dropInfo.conditions.price !== "0" &&
    dropInfo.conditions.paymentToken !== "0x0";

  if (isLoading) {
    return (
      <div className="container max-w-xl mx-auto px-4 pt-10 pb-16 space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!dropInfo) {
    return (
      <div className="container max-w-xl mx-auto px-4 pt-24 pb-8 text-center space-y-4">
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
      <div className="container max-w-xl mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <ShieldCheck className="h-10 w-10 text-muted-foreground/20 mx-auto" />
        <p className="text-muted-foreground">You are not the organizer of this drop.</p>
        <Button asChild variant="outline" size="sm">
          <Link href={`/launchpad/drop/${contract}`}>← Back to drop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-xl mx-auto px-4 pt-10 pb-16 space-y-6">
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

      {/* Allowlist toggle */}
      <FadeIn delay={0.08}>
        <AllowlistToggle
          contract={contract}
          enabled={allowlistEnabled ?? false}
          onToggle={handleToggleAllowlist}
        />
      </FadeIn>

      {/* Batch add */}
      <FadeIn delay={0.12}>
        <BatchAddSection onAdd={handleBatchAdd} isSubmitting={isSubmitting} />
      </FadeIn>

      {/* Remove single */}
      <FadeIn delay={0.16}>
        <RemoveSection onRemove={handleRemove} isSubmitting={isSubmitting} />
      </FadeIn>

      {/* Withdraw payments */}
      {isPaidDrop && (
        <FadeIn delay={0.2}>
          <div className="bento-cell p-5 space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-500" />
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

      <PinDialog
        open={pinOpen}
        onSubmit={handlePinSubmit}
        onCancel={() => { setPinOpen(false); setPendingCall(null); }}
        title="Confirm transaction"
        description="Enter your PIN to sign this on-chain operation."
      />

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
      />
    </div>
  );
}
