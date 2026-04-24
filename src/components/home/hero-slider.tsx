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
      {/* Background image with continuous Ken Burns CSS animation */}
      {imageUrl ? (
        <div className="absolute inset-0 overflow-hidden">
          <div className="animate-kenburns absolute inset-0">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              priority={active}
              unoptimized
            />
          </div>
        </div>
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
    <div className="absolute inset-0 overflow-hidden flex flex-col items-center justify-center gap-6 text-center px-6"
      style={{ background: "linear-gradient(135deg, hsl(var(--brand-purple) / 0.25) 0%, hsl(var(--brand-blue) / 0.15) 50%, hsl(var(--brand-navy) / 0.40) 100%)" }}
    >
      {/* Aurora blobs */}
      <div className="absolute aurora-purple w-[700px] h-[700px] opacity-25 -top-32 -left-32 pointer-events-none" />
      <div className="absolute aurora-blue w-[500px] h-[500px] opacity-20 -bottom-20 -right-20 pointer-events-none" />
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground) / 0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/50">
          IP Marketplace on Starknet
        </p>
        <h2 className="text-5xl sm:text-7xl font-black leading-none gradient-text">
          Mint. License.<br />Trade IP.
        </h2>
        <p className="text-white/60 text-base sm:text-lg max-w-sm mx-auto leading-relaxed">
          Tokenize your creative work, set licensing terms on-chain, and earn from every trade.
        </p>
      </div>

      <div className="flex gap-3 relative z-10">
        <Button
          asChild
          className="bg-white text-black hover:bg-white/90 font-semibold h-11 px-6"
        >
          <Link href="/launchpad">Start creating</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="bg-black/20 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 font-semibold h-11 px-6"
        >
          <Link href="/marketplace">Browse market</Link>
        </Button>
      </div>
    </div>
  );
}

// ---- Main slider ----
export function HeroSlider() {
  const { collections, isLoading } = useCollections(1, 3, true, "recent");
  const [current, setCurrent] = useState(0);
  const count = collections.length;

  const next = useCallback(() => {
    if (count > 1) setCurrent((c) => (c + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    if (count > 1) setCurrent((c) => (c - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(next, 7000);
    return () => clearInterval(id);
  }, [count, next]);

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
