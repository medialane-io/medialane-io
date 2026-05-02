"use client";

import Link from "next/link";
import { Gift, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

const HIGHLIGHTS = [
  "Free — no approval or fees",
  "Eligible for every prize distribution",
  "Publish photos, videos, music and more",
];

export function CreatorAirdropBanner() {
  return (
    <section>
      {/* Outer glow border */}
      <div className="relative rounded-3xl p-[1px] bg-gradient-to-br from-yellow-500/60 via-orange-400/30 to-rose-500/40">
        <div className="relative rounded-[23px] overflow-hidden bg-card">

          {/* Ambient blobs */}
          <div className="pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full bg-yellow-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-8 px-7 py-8">

            {/* Left: icon + text */}
            <div className="flex-1 space-y-4 min-w-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
                  <Gift className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-orange-400/80">Community Program</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                    Live
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                  Creator&apos;s{" "}
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Airdrop
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1.5 max-w-md">
                  Claim your participation record and join the Medialane community fund. Platform revenue goes back to creators — no investors, no middlemen.
                </p>
              </div>

              <ul className="space-y-1.5">
                {HIGHLIGHTS.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-orange-400/70 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: CTAs */}
            <div className="flex flex-col gap-2.5 w-full sm:w-auto shrink-0">
              <Link
                href="/airdrop"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5"
              >
                <Sparkles className="h-4 w-4" />
                Join the Airdrop
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/br/mint"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold border border-orange-500/30 text-orange-300 hover:bg-orange-500/10 transition-colors"
              >
                Campanha Brasil →
              </Link>
              <p className="text-[10px] text-center text-muted-foreground/50">
                Free · No purchase required
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
