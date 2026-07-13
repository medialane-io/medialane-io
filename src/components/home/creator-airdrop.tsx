"use client";

import Link from "next/link";
import { Gift, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

const HIGHLIGHTS = [
  "Free and frictionless participation",
  "Eligible for every prize distribution",
  "Create, trade and earn more rewards",
];

export function CreatorAirdropBanner() {
  return (
    <section>
      {/* Warm brand gradient frame */}
      <div className="relative rounded-3xl p-[1px] bg-gradient-to-br from-brand-rose/60 via-brand-orange/30 to-brand-price/40">
        <div className="relative rounded-[23px] overflow-hidden bg-card">

          {/* Ambient blobs */}
          <div className="pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full bg-brand-rose/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-brand-orange/10 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-8 px-7 py-8">

            {/* Left: icon + text */}
            <div className="flex-1 space-y-4 min-w-0">
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-xl bg-gradient-to-br from-brand-rose to-brand-orange flex items-center justify-center shrink-0">
                  <Gift className="h-2 w-2 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-orange/80">Launch Campaign</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-orange/15 text-brand-orange border border-brand-orange/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-orange animate-pulse" />
                    Live
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                  Creator&apos;s Airdrop
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1.5 max-w-md">
                  Claim your participation and join the creator&apos;s fund distribution.
                </p>
              </div>

              <ul className="space-y-1.5">
                {HIGHLIGHTS.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-orange/70 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: CTA */}
            <div className="flex flex-col gap-2.5 w-full sm:w-auto shrink-0">
              <div className="btn-border-animated p-[1px] rounded-xl">
                <Link
                  href="/airdrop"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[11px] px-5 py-3 text-sm font-semibold text-white bg-brand-orange transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <Sparkles className="h-4 w-4" />
                  Read More
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="text-[10px] text-center text-muted-foreground/50">
                Free · Frictionless
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
