"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePlatformStats } from "@/hooks/use-stats";
import { Button } from "@/components/ui/button";
import { KineticWords, EASE_OUT } from "@/components/ui/motion-primitives";
import { Compass, Sparkles, Zap } from "lucide-react";

export function Hero() {
  const { stats } = usePlatformStats();

  return (
    <section className="relative overflow-hidden border-b border-border/50 bg-background">
      <div className="relative px-4 py-16 sm:py-24 max-w-3xl mx-auto text-center sm:text-left">
        {/* Badge */}
        <motion.div
          className="flex justify-center sm:justify-start mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <span className="pill-badge">
            <Zap className="h-3 w-3" />
            IP marketplace on Starknet
          </span>
        </motion.div>

        {/* Kinetic headline */}
        <div
          className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] mb-6"
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

        {/* Subhead */}
        <motion.p
          className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto sm:mx-0 leading-relaxed mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: EASE_OUT }}
        >
          A decentralised marketplace for intellectual property NFTs built on Starknet.
          Register your creative works on-chain in under a minute.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease: EASE_OUT }}
        >
          <Button size="lg" asChild className="gap-2 bg-brand-purple text-white shadow-lg">
            <Link href="/marketplace">
              <Compass className="h-4 w-4" />
              Explore marketplace
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="gap-2">
            <Link href="/create">
              <Sparkles className="h-4 w-4" />
              Create IP asset
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
      </div>
    </section>
  );
}
