"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePlatformStats } from "@/hooks/use-stats";
import { useOrders } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { KineticWords, EASE_OUT } from "@/components/ui/motion-primitives";
import { Compass, Sparkles, Zap } from "lucide-react";
import { ipfsToHttp } from "@/lib/utils";

export function Hero() {
  const { stats } = usePlatformStats();
  const { orders: recentListings } = useOrders({ status: "ACTIVE", sort: "recent", limit: 5 });

  return (
    <section className="relative overflow-hidden border-b border-border/50 bg-background">
      <div className="relative px-4 sm:px-8 py-16 sm:py-24 text-center sm:text-left">
        {/* Badge */}
        <motion.div
          className="flex justify-center sm:justify-start mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <span className="pill-badge">
            Powered on Starknet
          </span>
        </motion.div>

        {/* Kinetic headline */}
        <div
          className="text-4xl font-black leading-[1.05] mb-6"
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

        {/* CTAs */}
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

        {/* Stats pills */}
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

        {/* Live asset strip */}
        {recentListings.length >= 3 && (
          <div className="mt-8 relative overflow-hidden">
            <div
              className="flex gap-4 w-max"
              style={{ animation: "scroll-strip 20s linear infinite" }}
              onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
              onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
            >
              {/* Render twice for seamless loop */}
              {[...recentListings, ...recentListings].map((listing, i) => (
                <Link
                  key={`${listing.orderHash}-${i}`}
                  href={`/asset/${listing.nftContract}/${listing.nftTokenId}`}
                  className="flex-shrink-0 w-36 group"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    {listing.token?.image && (
                      <img
                        src={ipfsToHttp(listing.token.image)}
                        alt={listing.token?.name ?? ""}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                  <p className="text-xs mt-1 truncate text-muted-foreground">{listing.token?.name ?? `#${listing.nftTokenId}`}</p>
                  <p className="text-xs font-semibold">{listing.price?.formatted ?? ""} {listing.price?.currency ?? ""}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
