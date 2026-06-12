"use client";

import Link from "next/link";
import { useTokenRemixes } from "@/hooks/use-remix-offers";
import { Skeleton } from "@/components/ui/skeleton";
import { GitBranch, ExternalLink } from "lucide-react";

// ─── RemixesTab ───────────────────────────────────────────────────────────────

interface RemixesTabProps {
  contractAddress: string;
  tokenId: string;
}

export function RemixesTab({ contractAddress, tokenId }: RemixesTabProps) {
  const { remixes, total, isLoading } = useTokenRemixes(contractAddress, tokenId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    );
  }

  if (remixes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <GitBranch className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm font-medium">No remixes yet</p>
        <p className="text-xs text-muted-foreground">Remix this asset to create the first derivative work.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{total} remix{total !== 1 ? "es" : ""} of this asset</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {remixes.map((remix) =>
          remix.remixContract && remix.remixTokenId ? (
            <Link
              key={remix.id}
              href={`/asset/${remix.remixContract}/${remix.remixTokenId}`}
              className="group relative block"
            >
              <div className="card-base p-3 space-y-1 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <GitBranch className="h-3 w-3 text-primary" />
                  <span className="text-primary font-medium">Remix</span>
                </div>
                <p className="text-xs font-mono truncate">#{remix.remixTokenId}</p>
                <p className="text-[10px] text-muted-foreground">{remix.licenseType}</p>
                <div className="flex gap-1 flex-wrap">
                  {remix.commercial && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">Commercial</span>
                  )}
                  {remix.derivatives && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Derivatives</span>
                  )}
                </div>
              </div>
            </Link>
          ) : null
        )}
      </div>
    </div>
  );
}

// ─── ParentAttributionBanner — canonical source in @medialane/ui ─────────────
export { ParentAttributionBanner } from "@medialane/ui";
