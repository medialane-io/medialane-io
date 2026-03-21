"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePlatformStats } from "@/hooks/use-stats";
import { useOrders } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { KineticWords, EASE_OUT } from "@/components/ui/motion-primitives";
import { Compass, Sparkles } from "lucide-react";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import type { ApiOrder } from "@medialane/sdk";

// ─── Stacked preview card (desktop hero decoration) ──────────────────────────

function NftPreviewCard({
  order,
  offsetX,
  offsetY,
  rotate,
  delay,
  zIndex,
}: {
  order: ApiOrder;
  offsetX: string;
  offsetY: string;
  rotate: string;
  delay: number;
  zIndex: number;
}) {
  const [imgError, setImgError] = useState(false);
  const image = order.token?.image && !imgError ? ipfsToHttp(order.token.image) : null;

  return (
    <motion.div
      className="absolute w-36 sm:w-44 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-card"
      style={{ left: offsetX, top: offsetY, transform: `rotate(${rotate})`, zIndex }}
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay, ease: EASE_OUT }}
    >
      <div className="aspect-square bg-muted">
        {image ? (
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-purple/30 to-brand-blue/20" />
        )}
      </div>
      <div className="p-2.5 border-t border-border/50">
        <p className="text-xs font-semibold truncate">{order.token?.name ?? `#${order.nftTokenId}`}</p>
        {order.price && (
          <p className="text-[11px] font-bold text-brand-orange mt-0.5">
            {formatDisplayPrice(order.price.formatted)} {order.price.currency}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Marquee pill card ────────────────────────────────────────────────────────

function MarqueePill({ listing }: { listing: ApiOrder }) {
  const [imgError, setImgError] = useState(false);
  const image = listing.token?.image && !imgError ? ipfsToHttp(listing.token.image) : null;

  return (
    <Link
      href={`/asset/${listing.nftContract}/${listing.nftTokenId}`}
      className="flex-shrink-0 flex items-center gap-2.5 bento-cell px-3 py-2 hover:bg-muted/40 active:scale-[0.98] transition-all duration-150 group"
    >
      <div className="h-9 w-9 rounded-lg overflow-hidden bg-muted shrink-0">
        {image ? (
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-purple/20 to-brand-blue/20" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium whitespace-nowrap max-w-[110px] truncate">
          {listing.token?.name ?? `#${listing.nftTokenId}`}
        </p>
        {listing.price && (
          <p className="text-[10px] font-bold text-brand-orange whitespace-nowrap">
            {formatDisplayPrice(listing.price.formatted)} {listing.price.currency}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Hero (exported) ──────────────────────────────────────────────────────────

export function Hero() {
  const { stats } = usePlatformStats();
  const { orders: recentListings } = useOrders({ status: "ACTIVE", sort: "recent", limit: 8 });

  const showStack = recentListings.length >= 3;
  const showMarquee = recentListings.length >= 3;

  return (
    <section className="relative overflow-hidden border-b border-border/50 bg-background">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 right-1/4 w-[500px] h-[500px] rounded-full bg-brand-purple/6 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-brand-blue/6 blur-3xl" />
      </div>

      {/* Main content grid */}
      <div className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left: text content */}
        <div className="text-center sm:text-left">
          <motion.div
            className="flex justify-center sm:justify-start mb-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            <span className="pill-badge">Powered on Starknet</span>
          </motion.div>

          <div
            className="text-4xl sm:text-5xl font-black leading-[1.05] mb-6"
            style={{ perspective: "800px" }}
          >
            <KineticWords text="Create, license &" />
            <br />
            <span className="gradient-text">
              <KineticWords text="trade IP assets" />
            </span>
            <br />
            <KineticWords text="— gasless for everyone." />
          </div>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: EASE_OUT }}
          >
            <Button size="lg" asChild className="gap-2 bg-brand-blue text-white shadow-lg">
              <Link href="/marketplace">
                <Compass className="h-4 w-4" />
                Explore
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2">
              <Link href="/create">
                <Sparkles className="h-4 w-4" />
                Create
              </Link>
            </Button>
          </motion.div>

          {stats && (
            <motion.div
              className="flex flex-wrap gap-2 justify-center sm:justify-start mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.55, ease: EASE_OUT }}
            >
              {[
                { label: "Collections", value: stats.collections },
                { label: "Assets", value: stats.tokens },
                { label: "Sales", value: stats.sales },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-sm backdrop-blur-sm"
                >
                  <span className="font-bold">{value?.toLocaleString() ?? "—"}</span>
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Right: stacked NFT preview cards — desktop only */}
        {showStack && (
          <div className="hidden lg:block relative h-80">
            <NftPreviewCard
              order={recentListings[0]}
              offsetX="52%"
              offsetY="8%"
              rotate="5deg"
              delay={0.3}
              zIndex={3}
            />
            <NftPreviewCard
              order={recentListings[1]}
              offsetX="20%"
              offsetY="22%"
              rotate="-4deg"
              delay={0.45}
              zIndex={2}
            />
            <NftPreviewCard
              order={recentListings[2]}
              offsetX="38%"
              offsetY="44%"
              rotate="2deg"
              delay={0.6}
              zIndex={1}
            />
          </div>
        )}
      </div>

      {/* Scrolling marquee strip */}
      {showMarquee && (
        <div className="border-t border-border/30 overflow-hidden py-3">
          <div
            className="flex gap-2 w-max"
            style={{ animation: "scroll-strip 50s linear infinite" }}
            onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
            onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
          >
            {[...recentListings, ...recentListings].map((listing, i) => (
              <MarqueePill key={`${listing.orderHash}-${i}`} listing={listing} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
