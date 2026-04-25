"use client";

import { useState } from "react";
import { Sparkles, ArrowUpRight, Layers, Flag } from "lucide-react";
import { ReportDialog } from "@/components/report-dialog";
import { ipfsToHttp } from "@/lib/utils";
import {
  PreviewHero, PreviewFooter, PreviewActionList, PreviewMeta,
  type AssetPreviewContentProps, type PreviewAction,
} from "./asset-preview-dialog";

export function AssetPreviewDrop({ token, onClose }: AssetPreviewContentProps) {
  const [reportOpen, setReportOpen] = useState(false);

  const name = token.metadata?.name || `Token #${token.tokenId}`;
  const image = ipfsToHttp(token.metadata?.image) ?? null;

  const assetHref = `/asset/${token.contractAddress}/${token.tokenId}`;
  const collectionHref = `/collections/${token.contractAddress}`;

  const secondaryActions: PreviewAction[] = [
    { icon: <ArrowUpRight className="h-4 w-4" />, label: "View details", href: assetHref, onClick: onClose },
    { icon: <Layers className="h-4 w-4" />, label: "View collection", href: collectionHref, onClick: onClose },
    {
      icon: <Flag className="h-4 w-4" />,
      label: "Report",
      onClick: () => setReportOpen(true),
      className: "text-muted-foreground/60",
      fullWidth: true,
    },
  ];

  return (
    <>
      <PreviewHero
        image={image}
        name={name}
        ipType={token.metadata?.ipType}
        accentOverlay={
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-brand-orange/40 bg-brand-orange/20 text-orange-300 backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            Drop
          </span>
        }
      />

      {/* Name */}
      <div className="px-5 pt-4 pb-1 shrink-0">
        <p className="font-bold text-lg leading-tight line-clamp-2">{name}</p>
        {token.metadata?.ipType && (
          <p className="text-xs text-muted-foreground mt-0.5">{token.metadata.ipType}</p>
        )}
      </div>

      <PreviewMeta token={token} />

      {/* Join Drop CTA + actions */}
      <div className="px-5 pb-2 pt-3 space-y-2 flex-1 overflow-y-auto">
        <a
          href={assetHref}
          onClick={onClose}
          className="w-full h-11 rounded-xl bg-brand-blue hover:brightness-110 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4" />
          Join drop
        </a>
        <PreviewActionList actions={secondaryActions} />
      </div>

      <PreviewFooter />

      <ReportDialog
        target={{ type: "TOKEN", contract: token.contractAddress, tokenId: token.tokenId, name }}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </>
  );
}
