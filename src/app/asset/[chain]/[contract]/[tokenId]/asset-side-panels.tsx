"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { CommentsSection } from "@/components/asset/comments-section";
import { AddressDisplay } from "@/components/shared/address-display";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface HolderLike {
  owner: string;
  amount: string;
}

interface AssetOwnersPanelProps {
  balances: HolderLike[];
  ownerLabel?: string;
  maxVisible?: number;
  showAmount?: boolean;
}

export function AssetOwnersPanel({
  balances,
  ownerLabel,
  maxVisible = 5,
  showAmount = true,
}: AssetOwnersPanelProps) {
  if (balances.length === 0) return null;

  const label = ownerLabel ?? (balances.length === 1 ? "Owner" : `${balances.length} owners`);

  return (
    <div className="rounded-xl border border-border px-4 py-3 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-col gap-1.5">
        {balances.slice(0, maxVisible).map((balance) => (
          <div key={balance.owner} className="flex items-center justify-between gap-2">
            <Link
              href={`/creator/${balance.owner}`}
              className="hover:text-primary transition-colors font-medium text-sm truncate"
            >
              <AddressDisplay address={balance.owner} chars={6} showCopy={false} />
            </Link>
            {showAmount ? (
              <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                × {balance.amount}
              </span>
            ) : null}
          </div>
        ))}
        {balances.length > maxVisible ? (
          <p className="text-xs text-muted-foreground/60">
            +{balances.length - maxVisible} more holders
          </p>
        ) : null}
      </div>
    </div>
  );
}

interface AssetCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: string;
  tokenId: string;
  name: string;
  imageUrl?: string | null;
  commentTotal: number;
  accentBorderClassName: string;
  accentHeaderStyle: string;
  accentAvatarStyle: string;
  accentLabelClassName?: string;
  accentCountStyle?: CSSProperties;
}

export function AssetCommentsDialog({
  open,
  onOpenChange,
  contract,
  tokenId,
  name,
  imageUrl,
  commentTotal,
  accentBorderClassName,
  accentHeaderStyle,
  accentAvatarStyle,
  accentLabelClassName,
  accentCountStyle,
}: AssetCommentsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md p-0 overflow-hidden gap-0 flex flex-col max-h-[85svh]">
        <div
          className={`flex items-center gap-3 pr-10 pl-4 pt-4 pb-3 shrink-0 border-b ${accentBorderClassName}`}
          style={{ background: accentHeaderStyle }}
        >
          <div
            className="relative h-9 w-9 rounded-full overflow-hidden shrink-0 ring-2 ring-white/20"
            style={{ background: accentAvatarStyle }}
          >
            {imageUrl ? (
              <Image src={imageUrl} alt={name} fill className="object-cover" unoptimized />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle asChild>
              <p className={`text-[10px] font-medium uppercase tracking-wider ${accentLabelClassName ?? ""}`}>
                Comments
              </p>
            </DialogTitle>
            <p className="text-sm font-semibold truncate text-foreground">{name}</p>
          </div>
          {commentTotal > 0 ? (
            <span
              className="shrink-0 text-xs font-bold rounded-full px-2 py-0.5 text-white"
              style={accentCountStyle}
            >
              {commentTotal}
            </span>
          ) : null}
        </div>
        <div className="flex-1 overflow-hidden">
          <CommentsSection contract={contract} tokenId={tokenId} className="h-full rounded-none border-0" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
