"use client";

import { describeError } from "@medialane/ui";
import { use, useState } from "react";
import Link from "next/link";
import { normalizeAddress } from "@medialane/sdk";
import {
  ArrowLeft, Users, Award, Loader2, CheckCircle2, AlertCircle, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FadeIn } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useCollection } from "@/hooks/use-collections";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Call } from "starknet";
import { buildPopAllowlist } from "@medialane/sdk/starknet";
import { claimLinks, claimLinksCsv, type ClaimLink } from "@/lib/pop-claim";

function parseAddresses(raw: string): string[] {
  return raw
    .split(/[\n,\s]+/)
    .map((a) => a.trim())
    .filter((a) => /^0x[0-9a-fA-F]+$/.test(a));
}

function downloadCsv(links: ClaimLink[]) {
  const href = URL.createObjectURL(new Blob([claimLinksCsv(links)], { type: "text/csv" }));
  const anchor = Object.assign(document.createElement("a"), { href, download: "claim-links.csv" });
  anchor.click();
  URL.revokeObjectURL(href);
}

function AllowlistSection({
  onPublish,
  isSubmitting,
  links,
}: {
  onPublish: (addresses: string[]) => void;
  isSubmitting: boolean;
  links: ClaimLink[] | null;
}) {
  const [raw, setRaw] = useState("");
  const parsed = parseAddresses(raw);

  return (
    <div className="bento-cell p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-green-500" />
        <span className="font-semibold text-sm">Participants</span>
        {parsed.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {parsed.length} address{parsed.length !== 1 ? "es" : ""}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Paste every participant&apos;s wallet address. Publishing replaces the previous list. The list stays in
        this browser — download the claim links and send each participant theirs.
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
        disabled={parsed.length === 0 || isSubmitting}
        onClick={() => onPublish(parsed)}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            Publishing…
          </>
        ) : (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Publish {parsed.length > 0 ? `${parsed.length} participant${parsed.length !== 1 ? "s" : ""}` : "participants"}
          </>
        )}
      </Button>
      {links && (
        <div className="space-y-2 pt-2">
          <Button variant="outline" size="sm" className="w-full" onClick={() => downloadCsv(links)}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download claim links (CSV)
          </Button>
          <ul className="max-h-48 overflow-auto text-xs tabular-nums space-y-1 text-muted-foreground">
            {links.map((link) => (
              <li key={link.address} className="truncate">{link.address}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

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
  const [links, setLinks] = useState<ClaimLink[] | null>(null);

  const isOwner =
    walletAddress &&
    collection?.owner &&
    normalizeAddress("STARKNET", walletAddress) === normalizeAddress("STARKNET", collection.owner);

  const execute = async (calls: Call[], successMsg: string): Promise<boolean> => {
    if (!hasWallet || !signer) return false;
    setIsSubmitting(true);
    try {
      await signer.execute(calls);
      setTxResult({ type: "success", message: successMsg });
      return true;
    } catch (err) {
      setTxResult({ type: "error", message: describeError(err, "Transaction failed").message });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = (addresses: string[]) => {
    const list = buildPopAllowlist(addresses);
    const count = Object.keys(list.proofs).length;
    void execute(
      [{ contractAddress: contract, entrypoint: "set_allowlist_root", calldata: [list.root] }],
      `Published ${count} participant${count !== 1 ? "s" : ""}`,
    ).then((ok) => {
      if (ok) setLinks(claimLinks(window.location.origin, contract, list));
    });
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
            Only participants on your <strong className="text-foreground">published list</strong> can claim,
            with the link you send them.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.12}>
        <AllowlistSection onPublish={handlePublish} isSubmitting={isSubmitting} links={links} />
      </FadeIn>

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
