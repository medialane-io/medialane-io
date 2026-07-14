"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ServiceHeader } from "@/components/claim/service-header";
import { ClaimBackButton } from "@/components/claim/claim-back-button";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { resolveTokenImage } from "@/lib/utils";
import { MEDIALANE_BACKEND_URL } from "@/lib/constants";
import type { ApiToken } from "@medialane/sdk";
import { GitBranch, ImageIcon, Inbox } from "lucide-react";

const PAGE_SIZE = 24;

/** Lists tokens whose creator-declared license permits derivatives
 *  (backend: GET /v1/tokens?derivatives=allowed). */
function useRemixableTokens() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch(`${MEDIALANE_BACKEND_URL}/v1/tokens?derivatives=allowed&limit=${PAGE_SIZE}&page=${page}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: { data: ApiToken[]; meta: { total: number } }) => {
        if (cancelled) return;
        setTokens((prev) => (page === 1 ? json.data : [...prev, ...json.data]));
        setHasMore(page * PAGE_SIZE < json.meta.total);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  return { tokens, isLoading, hasMore, error, loadMore: () => setPage((p) => p + 1) };
}

function RemixableCard({ token }: { token: ApiToken }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = resolveTokenImage(token.metadata?.image);
  const showImage = imageUrl && !imgError;
  const name = token.metadata?.name ?? `#${token.tokenId}`;

  return (
    <Link
      href={`/create/remix/${token.contractAddress}/${token.tokenId}`}
      className="group flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden transition-colors sm:hover:border-brand-blue/50 active:scale-[0.99] motion-reduce:transform-none"
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        {showImage ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="p-4 space-y-1">
        <p className="font-semibold text-sm leading-tight truncate">{name}</p>
        <p className="text-xs text-muted-foreground">
          Derivatives: {token.metadata?.derivatives ?? "Allowed"}
        </p>
        <p className="text-xs font-semibold pt-1 inline-flex items-center gap-1.5">
          <GitBranch className="h-3 w-3" />
          Remix this work
        </p>
      </div>
    </Link>
  );
}

function RemixableCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 overflow-hidden">
      <Skeleton className="aspect-square rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function RemixContent() {
  const { tokens, isLoading, hasMore, error, loadMore } = useRemixableTokens();

  return (
    <div className="pb-16">
      <section className="px-4 pt-10 max-w-5xl mx-auto">
        <ClaimBackButton />
        <FadeIn>
          <div className="mt-6">
            <ServiceHeader
              plain
              icon={<GitBranch className="h-4 w-4 text-white" />}
              title="Remix"
              subtitle="Pick a work that is open to remixing. Attribution and royalties flow back to the original creator."
            />
          </div>
        </FadeIn>
      </section>

      <section className="px-4 pt-8 max-w-5xl mx-auto space-y-6">
        {isLoading && tokens.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <RemixableCardSkeleton key={i} />
            ))}
          </div>
        ) : error && tokens.length === 0 ? (
          <div className="bento-cell p-10 flex flex-col items-center gap-3 text-center">
            <p className="font-semibold">Could not load works</p>
            <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
            <Button variant="outline" size="sm" onClick={() => location.reload()}>Retry</Button>
          </div>
        ) : tokens.length === 0 ? (
          <FadeIn>
            <div className="bento-cell p-10 flex flex-col items-center gap-4 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground/30" />
              <div>
                <p className="font-semibold">No works open to remixing yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Works appear here when their creator sets the license to allow derivatives.
                </p>
              </div>
            </div>
          </FadeIn>
        ) : (
          <>
            <Stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tokens.map((t) => (
                <StaggerItem key={`${t.contractAddress}-${t.tokenId}`}>
                  <RemixableCard token={t} />
                </StaggerItem>
              ))}
            </Stagger>
            {hasMore && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                  {isLoading ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
