"use client";

import { motion } from "framer-motion";
import { usePlatformStats } from "@/hooks/use-stats";
import { useOrders } from "@/hooks/use-orders";
import { KineticWords, EASE_OUT } from "@/components/ui/motion-primitives";
import { ActivityTicker } from "@/components/shared/activity-ticker";

export function Hero() {
  const { stats } = usePlatformStats();

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

      {/* Scrolling ticker */}
      <ActivityTicker limit={10} />
    </div>
  );
}
