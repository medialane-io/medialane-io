"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Tag, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTokensByIpType } from "@/hooks/use-tokens-by-ip-type";
import { IP_TYPE_MAP, IP_TYPE_CONFIG } from "@/lib/ip-type-config";
import { ipfsToHttp, formatDisplayPrice, cn } from "@/lib/utils";
import type { ApiToken } from "@medialane/sdk";

const PAGE_SIZE = 24;

// ---- Single token card ----
function TokenBrowseCard({ token }: { token: ApiToken }) {
  const [imgError, setImgError] = useState(false);
  const image = ipfsToHttp(token.metadata?.image);
  const name = token.metadata?.name || `#${token.tokenId}`;
  const activeOrder = token.activeOrders?.[0];
  const price = activeOrder?.price;
  const ipType = token.metadata?.ipType;
  const typeConfig = ipType
    ? IP_TYPE_CONFIG.find((c) => c.apiValue === ipType) ?? null
    : IP_TYPE_CONFIG.find((c) => c.slug === "nft") ?? null;

  return (
    <Link
      href={`/asset/${token.contractAddress}/${token.tokenId}`}
      className="group block rounded-xl border border-border overflow-hidden hover:border-primary/40 transition-all bg-card hover:shadow-lg hover:shadow-black/20"
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-muted relative">
        {image && !imgError ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted-foreground/10 to-muted/30 flex items-center justify-center">
            {typeConfig && (
              <typeConfig.icon className={cn("h-10 w-10 opacity-20", typeConfig.colorClass)} />
            )}
          </div>
        )}
        {/* Listed badge */}
        {price?.formatted && (
          <div className="absolute top-2 right-2">
            <Badge className="text-[10px] bg-black/70 text-white border-0 backdrop-blur-sm gap-1">
              <Tag className="h-2.5 w-2.5" />
              {formatDisplayPrice(price.formatted)} {price.currency}
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
          {name}
        </p>
        {price?.formatted ? (
          <p className="text-xs text-muted-foreground">
            Listed · {formatDisplayPrice(price.formatted)}{" "}
            <span className="text-muted-foreground/70">{price.currency}</span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Not listed</p>
        )}
      </div>
    </Link>
  );
}

function TokenBrowseCardSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

// ---- Main page ----
interface IpTypePageClientProps {
  slug: string;
}

export function IpTypePageClient({ slug }: IpTypePageClientProps) {
  const config = IP_TYPE_MAP[slug];
  const Icon = config?.icon;

  const [page, setPage] = useState(1);
  const [listedOnly, setListedOnly] = useState(false);
  const [allTokens, setAllTokens] = useState<ApiToken[]>([]);
  const prevSlug = useRef(slug);

  // Reset on slug change
  useEffect(() => {
    if (prevSlug.current !== slug) {
      prevSlug.current = slug;
      setPage(1);
      setAllTokens([]);
    }
  }, [slug]);

  const { tokens, meta, isLoading } = useTokensByIpType(slug, page, PAGE_SIZE);

  // Accumulate pages
  useEffect(() => {
    if (isLoading) return;
    if (page === 1) {
      setAllTokens(tokens);
    } else {
      setAllTokens((prev) => {
        const seen = new Set(prev.map((t) => `${t.contractAddress}:${t.tokenId}`));
        const fresh = tokens.filter((t) => !seen.has(`${t.contractAddress}:${t.tokenId}`));
        return fresh.length > 0 ? [...prev, ...fresh] : prev;
      });
    }
  }, [tokens, isLoading, page]);

  const displayed = listedOnly
    ? allTokens.filter((t) => (t.activeOrders?.length ?? 0) > 0)
    : allTokens;

  const isInitialLoading = isLoading && allTokens.length === 0;
  const isLoadingMore = isLoading && allTokens.length > 0;
  const hasMore = meta?.total != null ? allTokens.length < meta.total : false;
  const listedCount = allTokens.filter((t) => (t.activeOrders?.length ?? 0) > 0).length;

  return (
    <div className="container mx-auto px-5 sm:px-8 lg:px-12 pt-12 pb-16 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {config && Icon && (
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg", config.bgClass)}>
                <Icon className={cn("h-7 w-7", config.colorClass)} />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black">{config?.label ?? slug} Assets</h1>
              <p className="text-muted-foreground mt-0.5">
                {meta?.total != null ? (
                  <>{meta.total.toLocaleString()} indexed · {listedCount} listed</>
                ) : (
                  "Browsing indexed IP assets on Medialane"
                )}
              </p>
            </div>
          </div>

          {/* Type switcher chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {IP_TYPE_CONFIG.slice(0, 6).map((t) => (
              <Link
                key={t.slug}
                href={`/${t.slug}`}
                className={cn(
                  "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all font-medium",
                  t.slug === slug
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <t.icon className={cn("h-3 w-3", t.slug === slug ? t.colorClass : "")} />
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>
          <button
            onClick={() => setListedOnly((v) => !v)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-all font-medium",
              listedOnly
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            Listed only{listedCount > 0 && !isInitialLoading ? ` (${listedCount})` : ""}
          </button>
        </div>
      </div>

      {/* Grid */}
      {isInitialLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <TokenBrowseCardSkeleton key={i} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-24 flex flex-col items-center gap-4 text-center">
          {config && Icon && (
            <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center", config.bgClass)}>
              <Icon className={cn("h-8 w-8", config.colorClass)} />
            </div>
          )}
          <div>
            <p className="font-semibold text-lg">
              {listedOnly ? "No listed assets yet" : "No assets indexed yet"}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {listedOnly
                ? "Try removing the 'Listed only' filter to see all assets."
                : `Be the first to mint a ${config?.label ?? slug} asset on Medialane.`}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/create/asset">Create Asset</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayed.map((token) => (
              <TokenBrowseCard
                key={`${token.contractAddress}:${token.tokenId}`}
                token={token}
              />
            ))}
          </div>

          {(hasMore || isLoadingMore) && !listedOnly && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="lg"
                disabled={isLoadingMore}
                onClick={() => setPage((p) => p + 1)}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading…
                  </>
                ) : (
                  `Load more${meta?.total ? ` (${meta.total - allTokens.length} remaining)` : ""}`
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
