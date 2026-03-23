"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCollections } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { FadeIn, EASE_OUT } from "@/components/ui/motion-primitives";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { BRAND } from "@/lib/brand";
import type { ApiCollection } from "@medialane/sdk";

function Slide({ collection }: { collection: ApiCollection }) {
  const name = collection.name ?? "Featured Collection";
  const rawImage = collection.image ?? null;
  const image = rawImage ? ipfsToHttp(rawImage) : null;

  return (
    <div className="relative w-full h-full">
      {image ? (
        <img
          src={image}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/30 via-brand-blue/20 to-brand-navy/40" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 lg:p-10">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-3 max-w-lg">
          {name}
        </h2>

        <div className="flex items-center gap-4 mb-5">
          {collection.totalSupply != null && (
            <span className="text-sm text-white/70">
              <span className="font-bold text-white">{collection.totalSupply}</span> items
            </span>
          )}
          {collection.floorPrice && (
            <span className="text-sm text-white/70">
              Floor{" "}
              <span className="font-bold text-brand-orange">
                {formatDisplayPrice(collection.floorPrice)}
              </span>
            </span>
          )}
        </div>

        <Button
          asChild
          size="sm"
          className="gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm"
        >
          <Link href={`/collections/${collection.contractAddress}`}>
            View Collection <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function FeaturedCarousel() {
  const { collections, isLoading } = useCollections(1, 12, true);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = collections.length;
  const next = useCallback(() => setActive((p) => (p + 1) % total), [total]);
  const prev = useCallback(() => setActive((p) => (p - 1 + total) % total), [total]);

  // Reset active index when collection list changes
  useEffect(() => { setActive(0); }, [total]);

  useEffect(() => {
    if (paused || total <= 1) return;
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next, paused, total]);

  if (isLoading) {
    return (
      <FadeIn>
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mt-0.5">
                <Sparkles className={`h-4 w-4 ${BRAND.purple.text}`} />
                <h2 className="text-xl font-bold">Featured Collections</h2>
              </div>
            </div>
          </div>
          <div className="-mx-4 sm:-mx-6 lg:-mx-8 aspect-[16/7] sm:aspect-[21/9] bg-muted animate-pulse" />
        </section>
      </FadeIn>
    );
  }

  if (total === 0) return null;

  return (
    <FadeIn>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mt-0.5">
              <Sparkles className={`h-4 w-4 ${BRAND.purple.text}`} />
              <h2 className="text-xl font-bold">Featured Collections</h2>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground text-sm">
            <Link href="/collections">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div
          className="-mx-4 sm:-mx-6 lg:-mx-8 relative overflow-hidden aspect-[16/7] sm:aspect-[21/9] bg-muted"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              className="absolute inset-0"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
            >
              <Slide collection={collections[active]} />
            </motion.div>
          </AnimatePresence>

          {total > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {total > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
              {collections.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === active
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </FadeIn>
  );
}
