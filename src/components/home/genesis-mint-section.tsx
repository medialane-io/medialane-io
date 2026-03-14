"use client";

import { Gem } from "lucide-react";
import { LaunchMint } from "@/components/launch-mint";

export function GenesisMintSection() {
  return (
    <section className="relative space-y-8">
      {/* Subtle aurora behind this section */}
      <div className="absolute aurora-purple w-[500px] h-[500px] opacity-[0.06] -top-16 left-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Header */}
      <div className="relative text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-400">
          <Gem className="h-3.5 w-3.5" />
          Genesis Mint · Free &amp; Gas Sponsored
        </div>
        <h2 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
          Claim your{" "}
          <span className="gradient-text">Genesis NFT</span>
        </h2>
      </div>

      {/* Mint widget */}
      <div className="relative">
        <LaunchMint />
      </div>
    </section>
  );
}
