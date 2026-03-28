"use client";

import { Sparkles } from "lucide-react";
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
    </div>
  );
}
