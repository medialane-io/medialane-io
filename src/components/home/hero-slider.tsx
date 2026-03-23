"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useCollections } from "@/hooks/use-collections";
import { ipfsToHttp, formatDisplayPrice, cn } from "@/lib/utils";
import type { ApiCollection } from "@medialane/sdk";

// ---- Single slide ----
function HeroSlide({
  collection,
  active,
}: {
  collection: ApiCollection;
  active: boolean;
}) {
  const imageUrl = collection.image ? ipfsToHttp(collection.image) : null;
  const name = collection.name ?? "Collection";
  const floor = collection.floorPrice;
  const supply = collection.totalSupply;

  return (
    <div
      className={cn(
        "absolute inset-0 transition-opacity duration-700",
        active ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Background image */}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover scale-105"
          priority={active}
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/40 via-brand-blue/20 to-brand-navy/60" />
      )}

      {/* Darkening overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/30 to-black/0" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 flex flex-col gap-3">
        <h2 className="text-4xl lg:text-5xl font-semibold text-white leading-tight">{name}</h2>
        <div className="flex items-center gap-4 text-sm text-white/70">
          {supply != null && <span>{supply.toLocaleString()} items</span>}
          {floor && (
            <span className="text-white font-semibold">
              Floor {formatDisplayPrice(floor)}
            </span>
          )}
        </div>
        <Button
          asChild
          className="self-start mt-2 bg-white text-black hover:bg-white/90 font-semibold"
        >
          <Link href={`/collections/${collection.contractAddress}`}>
            View Collection <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ---- Fallback when no featured collections are available ----
function HeroPlaceholder() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/30 via-brand-blue/20 to-brand-navy/50 flex flex-col items-center justify-center gap-4 text-center px-6 overflow-hidden">
      <div className="absolute aurora-purple w-[600px] h-[600px] opacity-20 -top-24 -left-24" />
      <div className="absolute aurora-blue w-[400px] h-[400px] opacity-15 -bottom-16 -right-16" />
      <h2 className="text-4xl sm:text-6xl font-black gradient-text relative z-10">Medialane</h2>
      <p className="text-muted-foreground text-lg relative z-10 max-w-md">
        New monetization revenues for creative works
      </p>
      <div className="flex gap-3 relative z-10">
        <Button asChild>
          <Link href="/marketplace">Markets</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="bg-background/20 backdrop-blur-sm border-white/20 text-white hover:bg-white/10"
        >
          <Link href="/create/asset">Create</Link>
        </Button>
      </div>
    </div>
  );
}

// ---- Main slider ----
export function HeroSlider() {
  // Fetch the 3 most recent featured (isKnown=true) collections from the API
  const { collections, isLoading } = useCollections(1, 3, true, "recent");
  const [current, setCurrent] = useState(0);
  const count = collections.length;

  const next = useCallback(() => {
    if (count > 1) setCurrent((c) => (c + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    if (count > 1) setCurrent((c) => (c - 1 + count) % count);
  }, [count]);

  // Auto-advance every 5s
  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [count, next]);

  // Loading shimmer
  if (isLoading) {
    return (
      <section className="relative w-full h-[78vw] min-h-[420px] max-h-[768px] sm:h-[72vh] sm:max-h-[816px] bg-muted animate-pulse" />
    );
  }

  return (
    <section className="relative w-full h-[78vw] min-h-[420px] max-h-[768px] sm:h-[72vh] sm:max-h-[816px] overflow-hidden bg-muted">
      {count === 0 ? (
        <HeroPlaceholder />
      ) : (
        <>
          {collections.map((col, i) => (
            <HeroSlide key={col.contractAddress} collection={col} active={i === current} />
          ))}

          {/* Prev / Next arrows */}
          {count > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous slide"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={next}
                aria-label="Next slide"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {count > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {collections.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === current ? "w-6 bg-white" : "w-1.5 bg-white/40"
                  )}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
