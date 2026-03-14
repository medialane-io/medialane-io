"use client";

import { LaunchMint } from "@/components/launch-mint";

export function GenesisMintSection() {
  return (
    <section className="space-y-6">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-500">
          Genesis Mint
        </div>
        <h2 className="text-3xl sm:text-4xl font-black">
          Claim your{" "}
          <span className="gradient-text">Genesis NFT</span>
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Free to mint. Gas sponsored. Your passport to the Medialane airdrop.
        </p>
      </div>
      <LaunchMint />
    </section>
  );
}
