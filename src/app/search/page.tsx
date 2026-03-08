"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { Skeleton } from "@/components/ui/skeleton";
import { ipfsToHttp } from "@/lib/utils";
import { Search, Layers, ImageIcon } from "lucide-react";
import type { ApiSearchResult } from "@medialane/sdk";

function TokenCard({ token }: { token: NonNullable<ApiSearchResult["tokens"]>[number] }) {
  const [imgError, setImgError] = useState(false);
  const image = token.image ? ipfsToHttp(token.image) : null;

  return (
    <Link
      href={`/asset/${token.contractAddress}/${token.tokenId}`}
      className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
    >
      <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
        {image && !imgError ? (
          <Image
            src={image}
            alt={token.name ?? `Token #${token.tokenId}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
            <span className="text-2xl font-mono text-muted-foreground z-10">
              #{token.tokenId}
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm truncate">
          {token.name ?? `Token #${token.tokenId}`}
        </p>
        <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
          {token.contractAddress.slice(0, 14)}…
        </p>
      </div>
    </Link>
  );
}

function CollectionCard({ col }: { col: NonNullable<ApiSearchResult["collections"]>[number] }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = col.image ? ipfsToHttp(col.image) : null;
  const showImage = imageUrl && !imgError;
  const initial = (col.name ?? "?").charAt(0).toUpperCase();

  return (
    <Link
      href={`/collections/${col.contractAddress}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:bg-muted/30 transition-all"
    >
      <div className="relative h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-base font-bold shrink-0 overflow-hidden">
        {showImage ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm truncate">{col.name ?? "Unnamed"}</p>
        <p className="text-xs text-muted-foreground font-mono truncate">
          {col.contractAddress.slice(0, 20)}…
        </p>
      </div>
    </Link>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const client = useMedialaneClient();
  const [results, setResults] = useState<ApiSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) return;
    let cancelled = false;
    setIsLoading(true);
    setResults(null);
    client.api.search(q.trim(), 50).then((res) => {
      if (!cancelled) {
        setResults(res.data);
        setIsLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const tokens = results?.tokens ?? [];
  const collections = results?.collections ?? [];
  const totalResults = tokens.length + collections.length;

  return (
    <div className="container mx-auto px-4 pt-14 pb-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary">
          <Search className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Search</span>
        </div>
        <h1 className="text-3xl font-bold">
          {q ? `Results for "${q}"` : "Search"}
        </h1>
        {!isLoading && results && (
          <p className="text-muted-foreground">
            {totalResults === 0
              ? "No results found."
              : `${totalResults} result${totalResults !== 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !q && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Search className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Enter a search term to find tokens and collections.</p>
        </div>
      )}

      {!isLoading && results && (
        <>
          {/* Collections */}
          {collections.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">
                  Collections <span className="text-muted-foreground font-normal">({collections.length})</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {collections.map((col) => (
                  <CollectionCard key={col.contractAddress} col={col} />
                ))}
              </div>
            </section>
          )}

          {/* Tokens */}
          {tokens.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">
                  Tokens <span className="text-muted-foreground font-normal">({tokens.length})</span>
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {tokens.map((t) => (
                  <TokenCard key={`${t.contractAddress}-${t.tokenId}`} token={t} />
                ))}
              </div>
            </section>
          )}

          {totalResults === 0 && q && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <Search className="h-12 w-12 text-muted-foreground/30" />
              <p className="font-semibold">No results for "{q}"</p>
              <p className="text-sm text-muted-foreground">
                Try a different name, token ID, or contract address.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 pt-14 pb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
