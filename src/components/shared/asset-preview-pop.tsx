"use client";

import { useState } from "react";
import { ShieldCheck, ArrowUpRight, Layers, Flag, Award } from "lucide-react";
import { ReportDialog } from "@/components/report-dialog";
import { ipfsToHttp } from "@/lib/utils";
import {
  PreviewHero, PreviewFooter, PreviewActionList, PreviewMeta, PreviewOwnerRow,
  type AssetPreviewContentProps, type PreviewAction,
} from "./asset-preview-dialog";

export function AssetPreviewPop({ token, onClose }: AssetPreviewContentProps) {
  const [reportOpen, setReportOpen] = useState(false);

  const name = token.metadata?.name || `Token #${token.tokenId}`;
  const image = ipfsToHttp(token.metadata?.image) ?? null;

  const assetHref = `/asset/${token.contractAddress}/${token.tokenId}`;
  const collectionHref = `/collections/${token.contractAddress}`;
  const creatorOwner = token.balances?.[0]?.owner ?? token.owner ?? null;
  const creatorHref = creatorOwner ? `/account/${creatorOwner}` : null;

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
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 backdrop-blur-sm">
            <ShieldCheck className="h-3 w-3" />
            Soulbound
          </span>
        }
      />

      {/* Name + credential identity */}
      <div className="px-5 pt-4 pb-1 shrink-0">
        <p className="font-bold text-lg leading-tight line-clamp-2">{name}</p>
        <div className="flex items-center gap-1.5 mt-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Award className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium text-emerald-400">Soulbound Credential</span>
          <span className="text-xs text-muted-foreground ml-1">· Non-transferable</span>
        </div>
      </div>

      <PreviewMeta token={token} />
      {creatorOwner && <PreviewOwnerRow owner={creatorOwner} label="Creator" />}

      {/* Claim CTA + actions */}
      <div className="px-5 pb-2 pt-3 space-y-2 flex-1 overflow-y-auto">
        <a
          href={assetHref}
          onClick={onClose}
          className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <ShieldCheck className="h-4 w-4" />
          Claim credential
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
