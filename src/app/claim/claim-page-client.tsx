"use client";

import { Sparkles, Globe, Share2, ShieldCheck, Palette, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LaunchMint } from "@/components/launch-mint";
import { ClaimGate } from "@/components/claim/claim-gate";
import { ClaimCollectionPanel } from "@/components/claim/claim-collection-panel";
import { UsernameClaimPanel } from "@/components/shared/username-claim-panel";

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export function ClaimPageClient() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-12 max-w-5xl space-y-16 pb-20">
      {/* Page header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-3xl font-black">Claims & Drops</h1>
        </div>
        <p className="text-muted-foreground">
          Exclusive drops, collections and creator pages available on Medialane.
        </p>
      </div>

      {/* Section 1 — Genesis Mint */}
      <section>
        <LaunchMint />
      </section>

      {/* Section 2 — Claim NFT Collection */}
      <section className="space-y-8">
        <SectionDivider label="Claim your collection" />
        <div>
          <h2 className="text-xl font-bold mb-1">NFT Collection</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Import an existing Starknet ERC-721 collection into your Medialane profile.
          </p>
          <ClaimGate>
            <ClaimCollectionPanel />
          </ClaimGate>
        </div>
      </section>

      {/* Section 3 — Claim Creator Page */}
      <section className="space-y-8">
        <SectionDivider label="Claim your creator page" />
        <div>
          <h2 className="text-xl font-bold mb-1">Creator Username</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Reserve your creator URL at{" "}
            <span className="font-mono text-foreground">medialane.io/creator/yourname</span>.
          </p>
          <ClaimGate>
            <UsernameClaimPanel />
          </ClaimGate>
        </div>
      </section>

      {/* Section 4 — Branded Collection Page */}
      <section className="space-y-8">
        <SectionDivider label="Your collection page" />
        <div>
          <h2 className="text-xl font-bold mb-1">Branded Drop Page</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Every collection you deploy on Medialane gets a fully branded, shareable page — no setup required.
          </p>
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-8 space-y-5">
            {/* URL bar */}
            <div className="flex items-center gap-2 bg-muted/50 border border-border/60 rounded-lg px-3 py-2 font-mono text-sm max-w-md">
              <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground text-xs">medialane.io/collections/</span>
              <span className="text-foreground text-xs font-semibold truncate">0x04f5…1a3b</span>
            </div>
            {/* Feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Palette className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Fully branded</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Custom name, cover image, banner, and social links — all editable in collection settings.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Share2 className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold">One shareable link</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Share your collection, assets, and listings in a single URL — perfect for social and email.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Always accessible</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Permanently anchored on Starknet. No central authority can remove it.</p>
                </div>
              </div>
            </div>
            {/* CTA */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-border/60">
              <Button size="sm" asChild>
                <Link href="/create/collection">
                  Create a collection <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/collections">Browse collections</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
