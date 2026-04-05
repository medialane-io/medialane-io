"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Users, Award, Loader2, CheckCircle2, AlertCircle, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FadeIn } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { useCollection } from "@/hooks/use-collections";
import { toast } from "sonner";

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
        className="font-mono text-xs resize-none"
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

export default function PopManagePage({
  params,
}: {
  params: Promise<{ contract: string }>;
}) {
  const { contract } = use(params);
  const { walletAddress, hasWallet } = useSessionKey();
  const { collection, isLoading } = useCollection(contract);
  const { executeTransaction, isSubmitting } = useChipiTransaction();

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingCall, setPendingCall] = useState<{
    calls: Array<{ contractAddress: string; entrypoint: string; calldata: string[] }>;
    successMsg: string;
  } | null>(null);

  const isOwner =
    walletAddress &&
    collection?.owner &&
    walletAddress.toLowerCase() === collection.owner.toLowerCase();

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
      } else {
        toast.error(result.revertReason ?? "Transaction reverted");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transaction failed");
    }
  };

  const handleBatchAdd = (addresses: string[]) => {
    execute(
      [{
        contractAddress: contract,
        entrypoint: "batch_add_to_allowlist",
        calldata: [addresses.length.toString(), ...addresses],
      }],
      `Added ${addresses.length} participant${addresses.length !== 1 ? "s" : ""} to allowlist`
    );
  };

  const handleRemove = (address: string) => {
    execute(
      [{ contractAddress: contract, entrypoint: "remove_from_allowlist", calldata: [address] }],
      "Participant removed from allowlist"
    );
  };

  if (isLoading) {
    return (
      <div className="container max-w-xl mx-auto px-4 pt-10 pb-16 space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container max-w-xl mx-auto px-4 pt-24 pb-8 text-center space-y-4">
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
      <div className="container max-w-xl mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <Award className="h-10 w-10 text-muted-foreground/20 mx-auto" />
        <p className="text-muted-foreground">You are not the organizer of this event.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/launchpad/pop">← Back to events</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-xl mx-auto px-4 pt-10 pb-16 space-y-6">
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
