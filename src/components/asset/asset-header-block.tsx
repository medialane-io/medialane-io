"use client";

import Link from "next/link";
import { AddressDisplay } from "@/components/shared/address-display";
import { IpTypeBadge } from "@/components/shared/ip-type-badge";
import { ParentAttributionBanner } from "@/components/asset/remixes-tab";

interface AssetHeaderBlockProps {
  name: string;
  description?: string | null;
  ipType?: string | null;
  parentContract?: string | null;
  parentTokenId?: string | null;
  ownerAddress?: string | null;
}

export function AssetHeaderBlock({
  name,
  description,
  ipType,
  parentContract,
  parentTokenId,
  ownerAddress,
}: AssetHeaderBlockProps) {
  return (
    <div className="min-w-0 flex-1">
      {ipType ? (
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <IpTypeBadge ipType={ipType} size="md" />
        </div>
      ) : null}

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
          <span className="font-semibold">Owner</span>
          <Link
            href={`/creator/${ownerAddress}`}
            className="hover:text-primary transition-colors font-medium"
          >
            <AddressDisplay address={ownerAddress} />
          </Link>
        </div>
      ) : null}

      <h1 className="text-2xl lg:text-4xl font-bold leading-tight break-words">{name}</h1>

      {description ? (
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">{description}</p>
      ) : null}
    </div>
  );
}
