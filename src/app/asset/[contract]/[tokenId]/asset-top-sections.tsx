"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { IpTypeBadge } from "@/components/shared/ip-type-badge";
import { AddressDisplay } from "@/components/shared/address-display";
import { ParentAttributionBanner } from "@/components/asset/remixes-tab";
import type { IPType } from "@/types/ip";
import { Layers, Users } from "lucide-react";

interface AssetMediaColumnProps {
  shouldReduce: boolean;
  image: string;
  imageAlt: string;
  imgError: boolean;
  onImageError: () => void;
  fallback: React.ReactNode;
  stats?: Array<{
    value: string;
    label: string;
    icon: React.ReactNode;
  }>;
}

export function AssetMediaColumn({
  shouldReduce,
  image,
  imageAlt,
  imgError,
  onImageError,
  fallback,
  stats,
}: AssetMediaColumnProps) {
  return (
    <motion.div
      initial={shouldReduce ? false : { scale: 1.0, opacity: 0 }}
      animate={{ scale: 1.02, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="overflow-hidden rounded-xl lg:sticky lg:top-16"
    >
      <div className="rounded-2xl overflow-hidden border border-border bg-muted">
        {image && !imgError ? (
          <Image
            src={image}
            alt={imageAlt}
            width={0}
            height={0}
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="w-full h-auto"
            onError={onImageError}
            priority
          />
        ) : (
          fallback
        )}
      </div>

      {stats && stats.length > 0 ? (
        <div className={`grid gap-3 mt-4 ${stats.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-muted/20 p-4 text-center">
              <p className="text-2xl font-black">{stat.value}</p>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                {stat.icon}
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}

interface AssetHeaderBlockProps {
  name: string;
  description?: string | null;
  ipType?: IPType | string | null;
  showMultiEditionBadge?: boolean;
  parentContract?: string | null;
  parentTokenId?: string | null;
  ownerAddress?: string | null;
}

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
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {ipType ? <IpTypeBadge ipType={ipType} size="md" /> : null}
        {showMultiEditionBadge ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-500">
            <Layers className="h-3 w-3" />
            Multi-edition
          </span>
        ) : null}
      </div>
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
      <h1 className="text-3xl lg:text-5xl font-bold">{name}</h1>
      {description ? (
        <p className="text-sm text-muted-foreground leading-relaxed mt-1">{description}</p>
      ) : null}
    </div>
  );
}

export function buildEditionStats(totalEditions: number, uniqueOwners: number) {
  return [
    {
      value: totalEditions.toLocaleString(),
      label: "editions minted",
      icon: <Layers className="h-3 w-3" />,
    },
    {
      value: uniqueOwners.toLocaleString(),
      label: "unique owners",
      icon: <Users className="h-3 w-3" />,
    },
  ];
}
