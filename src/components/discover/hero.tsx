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
import { CurrencyIcon } from "@/components/shared/currency-icon";
import type { ApiOrder } from "@medialane/sdk";

function MarqueePill({ listing }: { listing: ApiOrder }) {
  const [imgError, setImgError] = useState(false);
  const image = listing.token?.image && !imgError ? ipfsToHttp(listing.token.image) : null;

  return (
    <Link
      href={`/asset/${listing.nftContract}/${listing.nftTokenId}`}
      className="flex-shrink-0 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 hover:bg-muted/60 active:scale-[0.98] transition-all duration-150 group"
    >
      <div className="h-8 w-8 rounded-lg overflow-hidden bg-muted shrink-0">
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
        <p className="text-xs font-medium whitespace-nowrap max-w-[100px] truncate">
          {listing.token?.name ?? `#${listing.nftTokenId}`}
        </p>
        {listing.price && (
          <p className="text-[10px] font-bold text-brand-orange whitespace-nowrap flex items-center gap-0.5">
            <CurrencyIcon symbol={listing.price.currency} size={10} />
            {formatDisplayPrice(listing.price.formatted)} {listing.price.currency}
          </p>
        )}
      </div>
    </Link>
  );
}

export function Hero() {
  const { stats } = usePlatformStats();
  const { orders: recentListings } = useOrders({ status: "ACTIVE", sort: "recent", limit: 10 });
  const showMarquee = recentListings.length >= 3;

  return (
    <div className="space-y-6 pt-2 pb-6 border-b border-border/50">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
      >
        <span className="pill-badge">Powered on Starknet</span>
      </motion.div>

      {/* Headline */}
      <motion.div
        className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1]"
        style={{ perspective: "800px" }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}
      >
        <span className="gradient-text">
          <KineticWords text="Create, license & trade" />
        </span>
        <br />
        <KineticWords text="NFT — gasless." />
      </motion.div>

      {/* CTAs 
      <motion.div
        className="flex flex-wrap gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: EASE_OUT }}
      >
        <Button asChild className="gap-2 bg-brand-blue hover:bg-brand-blue/90 text-white">
          <Link href="/marketplace">
            <Compass className="h-4 w-4" />
            Explore market
          </Link>
        </Button>
        <Button variant="outline" asChild className="gap-2">
          <Link href="/create">
            <Sparkles className="h-4 w-4" />
            Create
          </Link>
        </Button>
      </motion.div>*/}

      {/* Stats chips */}
      {stats && (
        <motion.div
          className="flex flex-wrap gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35, ease: EASE_OUT }}
        >
          {[
            { label: "Collections", value: stats.collections },
            { label: "Assets", value: stats.tokens },
            { label: "Sales", value: stats.sales },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm"
            >
              <span className="font-bold tabular-nums">{value?.toLocaleString() ?? "—"}</span>
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Scrolling marquee — lives inside the container, no bleed */}
      {showMarquee && (
        <div className="relative overflow-hidden rounded-xl border border-border/40 bg-muted/20 py-2.5">
          <div
            className="flex gap-2 w-max px-2"
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
    </div>
  );
}
