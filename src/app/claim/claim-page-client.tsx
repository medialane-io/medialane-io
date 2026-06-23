"use client";

import Link from "next/link";
import { Sparkles, FolderInput, AtSign, Link2, ArrowRight, type LucideIcon } from "lucide-react";
import { LaunchMint } from "@/components/launch-mint";

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

const CLAIM_CARDS: { href: string; icon: LucideIcon; iconClass: string; title: string; blurb: string }[] = [
  {
    href: "/claim/collection",
    icon: FolderInput,
    iconClass: "text-blue-500 bg-blue-500/10",
    title: "Claim a Collection",
    blurb: "Already deployed an ERC-721 collection on Starknet? Import it into your Medialane profile.",
  },
  {
    href: "/claim/username",
    icon: AtSign,
    iconClass: "text-violet-500 bg-violet-500/10",
    title: "Claim your Username",
    blurb: "Reserve your creator URL — medialane.io/creator/yourname — and get a shareable creator page.",
  },
  {
    href: "/claim/collection-name",
    icon: Link2,
    iconClass: "text-pink-500 bg-pink-500/10",
    title: "Claim a Collection Name",
    blurb: "Give a collection a clean, memorable web address instead of a long contract address.",
  },
];

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

      {/* Section 2 — Claim cards */}
      <section className="space-y-8">
        <SectionDivider label="Claims" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CLAIM_CARDS.map(({ href, icon: Icon, iconClass, title, blurb }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-primary/40 hover:shadow-lg transition-all"
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-bold">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{blurb}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                Start claim
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
