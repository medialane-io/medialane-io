"use client";

import { ShieldCheck, Tag } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { IpTypeBadge } from "@/components/shared/ip-type-badge";
import type { ApiToken } from "@medialane/sdk";
import type { CollectionSource } from "@medialane/sdk";
import { AssetPreviewStandard } from "./asset-preview-standard";
import { AssetPreviewEdition } from "./asset-preview-edition";
import { AssetPreviewPop } from "./asset-preview-pop";
import { AssetPreviewDrop } from "./asset-preview-drop";

// ── Shared prop type used by all four variants ────────────────────────────────
export interface AssetPreviewContentProps {
  token: ApiToken;
  isOwner: boolean;
  onClose: () => void;
  onList?: (token: ApiToken) => void;
  onCancel?: (token: ApiToken) => void;
  onTransfer?: (token: ApiToken) => void;
}

// ── Shared sub-components ─────────────────────────────────────────────────────

export function PreviewHero({
  image,
  name,
  ipType,
  accentOverlay,
}: {
  image: string | null;
  name: string;
  ipType?: string | null;
  accentOverlay?: React.ReactNode;
}) {
  return (
    <div className="relative h-52 w-full bg-muted overflow-hidden shrink-0">
      {image ? (
        <img src={image} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-brand-blue/20 via-brand-purple/10 to-transparent flex items-center justify-center">
          <Tag className="h-12 w-12 text-brand-blue/30" />
        </div>
      )}
      {ipType && (
        <div className="absolute top-3 left-3">
          <IpTypeBadge ipType={ipType} size="sm" />
        </div>
      )}
      {accentOverlay}
    </div>
  );
}

export function PreviewFooter() {
  return (
    <div className="px-5 py-3 border-t border-border/40 shrink-0">
      <div className="flex items-start justify-center gap-1.5">
        <ShieldCheck className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[10px] text-center text-muted-foreground">
          Protected onchain via our permissionless protocol · Gas fees sponsored by Medialane
        </p>
      </div>
    </div>
  );
}

export interface PreviewAction {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function PreviewActionList({ actions }: { actions: PreviewAction[] }) {
  return (
    <div className="space-y-0.5">
      {actions.map((action, i) => {
        const cls = [
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
          "hover:bg-muted/60 active:bg-muted text-left",
          action.disabled ? "opacity-50 pointer-events-none" : "",
          action.className ?? "",
        ].join(" ");

        if (action.href) {
          return (
            <a key={i} href={action.href} className={cls} onClick={action.onClick}>
              {action.icon}
              {action.label}
            </a>
          );
        }
        return (
          <button key={i} type="button" className={cls} onClick={action.onClick} disabled={action.disabled}>
            {action.icon}
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Dispatch logic ────────────────────────────────────────────────────────────
function pickVariant(serviceSource?: CollectionSource | string, standard?: string): "pop" | "drop" | "edition" | "standard" {
  if (serviceSource === "POP_PROTOCOL") return "pop";
  if (serviceSource === "COLLECTION_DROP") return "drop";
  if (standard === "ERC1155") return "edition";
  return "standard";
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
interface AssetPreviewDialogProps {
  token: ApiToken;
  serviceSource?: CollectionSource | string;
  isOwner?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onList?: (token: ApiToken) => void;
  onCancel?: (token: ApiToken) => void;
  onTransfer?: (token: ApiToken) => void;
}

export function AssetPreviewDialog({
  token,
  serviceSource,
  isOwner = false,
  open,
  onOpenChange,
  onList,
  onCancel,
  onTransfer,
}: AssetPreviewDialogProps) {
  const variant = pickVariant(serviceSource, token.standard);

  const sharedProps: AssetPreviewContentProps = {
    token,
    isOwner,
    onClose: () => onOpenChange(false),
    onList,
    onCancel,
    onTransfer,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-12px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl flex flex-col max-h-[92svh]">
        {variant === "pop" && <AssetPreviewPop {...sharedProps} />}
        {variant === "drop" && <AssetPreviewDrop {...sharedProps} />}
        {variant === "edition" && <AssetPreviewEdition {...sharedProps} />}
        {variant === "standard" && <AssetPreviewStandard {...sharedProps} />}
      </DialogContent>
    </Dialog>
  );
}
