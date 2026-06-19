"use client";

import Link from "next/link";
import { Layers } from "lucide-react";
import { AddressDisplay } from "@/components/shared/address-display";
import { IpTypeBadge } from "@/components/shared/ip-type-badge";
import { ParentAttributionBanner } from "@/components/asset/remixes-tab";

interface AssetHeaderBlockProps {
  name: string;
  description?: string | null;
  ipType?: string | null;
  showMultiEditionBadge?: boolean;
  parentContract?: string | null;
  parentTokenId?: string | null;
  ownerAddress?: string | null;
}

/**
 * Story-first asset header (standard page). Title is one step smaller than the
 * shared `@medialane/ui` block, and the IP-type pill — which already links to
 * the IP-type explore page — sits directly under the title for prominence
 * (it used to read as a small chip lost above the owner row).
 */
export function AssetHeaderBlock({
  name,
  description,
  ipType,
  showMultiEditionBadge = false,
  parentContract,
  parentTokenId,
  ownerAddress,
}: AssetHeaderBlockProps) {
  return (
    <div>
      {parentContract && parentTokenId ? (
        <div className="mb-3">
          <ParentAttributionBanner
            parentContract={parentContract}
            parentTokenId={parentTokenId}
            parentName={`Token #${parentTokenId}`}
          />
        </div>
      ) : null}

      {ownerAddress ? (
        <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider">Owner</span>
          <Link
            href={`/creator/${ownerAddress}`}
            className="hover:text-primary transition-colors font-medium"
          >
            <AddressDisplay address={ownerAddress} />
          </Link>
        </div>
      ) : null}

      <h1 className="text-2xl lg:text-4xl font-bold leading-tight">{name}</h1>

      <div className="flex items-center gap-2 flex-wrap mt-2">
        {ipType ? <IpTypeBadge ipType={ipType} size="md" /> : null}
        {showMultiEditionBadge ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-500">
            <Layers className="h-3 w-3" />
            Multi-edition
          </span>
        ) : null}
      </div>

      {description ? (
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">{description}</p>
      ) : null}
    </div>
  );
}
