"use client";

import Link from "next/link";
import {
  Paintbrush, ShoppingBag, Award, Package, Layers,
  ArrowRight, Rocket, Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface Feature {
  icon: React.ElementType;
  label: string;
  subtitle: string;
  description: string;
  example: string;
  chips: string[];
  color: string;
  button: string;
  gradient: string;
  chip: string;
  href: string;
  cta: string;
}

const FEATURES: Feature[] = [
  {
    icon: Paintbrush,
    label: "Mint NFT",
    subtitle: "Publish your creative work on Starknet",
    description: "Upload any photo, video, audio, or document and mint it as an IP NFT — with licensing, provenance, and ownership all locked on-chain.",
    example: "e.g. A song, a photo, an ebook, a short film",
    chips: ["Gasless via ChipiPay", "IPFS metadata", "Programmable licensing"],
    color: BRAND.blue.text,
    button: "bg-brand-blue",
    gradient: "from-blue-500/50 via-cyan-400/20 to-blue-600/30",
    chip: "border-blue-500/30 text-blue-400 bg-blue-500/10",
    href: "/create/asset",
    cta: "Mint NFT",
  },
  {
    icon: Layers,
    label: "NFT Collection",
    subtitle: "Group your NFTs under a shared identity",
    description: "Deploy a branded ERC-721 collection with its own page and on-chain identity. Add assets to it at any time and share it with collectors.",
    example: "e.g. A photography portfolio, a music catalog, a comic series",
    chips: ["Factory-deployed ERC-721", "Branded collection page", "Add assets anytime"],
    color: BRAND.purple.text,
    button: "bg-brand-purple",
    gradient: "from-purple-500/50 via-violet-400/20 to-purple-700/30",
    chip: "border-purple-500/30 text-purple-400 bg-purple-500/10",
    href: "/create/collection",
    cta: "Create collection",
  },
  {
    icon: Copy,
    label: "Limited Editions",
    subtitle: "Release your IP in numbered multiples",
    description: "Create a collection built for editions — release music tracks, art prints, or any IP in multiples. Each token is numbered and tradeable on Medialane.",
    example: "e.g. 50 copies of a limited print, a music single in 100 editions",
    chips: ["Multi-edition ERC-1155", "Numbered tokens", "Tradeable on Medialane"],
    color: BRAND.rose.text,
    button: "bg-brand-rose",
    gradient: "from-rose-500/50 via-pink-400/20 to-rose-700/30",
    chip: "border-rose-500/30 text-rose-400 bg-rose-500/10",
    href: "/launchpad/nfteditions",
    cta: "Mint editions",
  },
  {
    icon: Package,
    label: "Collection Drop",
    subtitle: "Timed NFT releases with mint windows",
    description: "Launch a time-gated mint campaign with a price, supply cap, and branded drop page that collectors can mint directly from.",
    example: "e.g. A 48-hour drop of 200 NFTs at 5 USDC each",
    chips: ["Timed mint window", "Price + supply cap", "Branded drop page"],
    color: BRAND.orange.text,
    button: "bg-brand-orange",
    gradient: "from-orange-500/50 via-amber-400/20 to-orange-700/30",
    chip: "border-orange-500/30 text-orange-400 bg-orange-500/10",
    href: "/launchpad/drop",
    cta: "Launch drop",
  },
  {
    icon: Award,
    label: "POP Protocol",
    subtitle: "Proof-of-participation credentials",
    description: "Issue soulbound badges to your community — one non-transferable credential per wallet, permanently on-chain. No faking, no transferring.",
    example: "e.g. Hackathon badge, conference pass, community membership",
    chips: ["Soulbound · non-transferable", "One per wallet", "Optional gating"],
    color: BRAND.rose.text,
    button: "bg-brand-rose",
    gradient: "from-rose-600/50 via-red-400/20 to-rose-800/30",
    chip: "border-rose-500/30 text-rose-400 bg-rose-500/10",
    href: "/launchpad/pop",
    cta: "Create event",
  },
  {
    icon: ShoppingBag,
    label: "Marketplace",
    subtitle: "Browse, buy, and trade IP assets",
    description: "Discover and trade IP NFTs from creators on Starknet. Buy with USDC, ETH, STRK, or WBTC — gasless and instantly settled.",
    example: "e.g. Buy an art print, make an offer on a music track",
    chips: ["Gasless trading", "USDC · ETH · STRK · WBTC", "Instant settlement"],
    color: BRAND.navy.text,
    button: "bg-brand-navy",
    gradient: "from-blue-900/60 via-indigo-700/20 to-blue-800/30",
    chip: "border-indigo-700/30 text-indigo-300 bg-indigo-900/20",
    href: "/marketplace",
    cta: "Browse marketplace",
  },
];

function ServiceCard({ feature }: { feature: Feature }) {
  const { icon: Icon, label, subtitle, description, example, chips, color, button, gradient, chip, href, cta } = feature;
  return (
    <div className={cn("p-[1px] rounded-2xl bg-gradient-to-br transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/25 flex flex-col", gradient)}>
      <Link href={href} className="group flex flex-col flex-1 rounded-[15px] bg-card p-5 gap-4 min-h-[360px]">
        {/* Icon */}
        <Icon className={cn("h-8 w-8 transition-transform duration-200 group-hover:scale-110", color)} />

        {/* Title + subtitle */}
        <div className="space-y-1">
          <p className="font-bold text-base leading-tight">{label}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
        </div>

        {/* Description + example */}
        <div className="flex-1 space-y-1.5">
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          <p className="text-xs text-muted-foreground/60 italic">{example}</p>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span key={c} className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", chip)}>
              {c}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className={cn(
          "flex items-center justify-between w-full h-9 px-3 rounded-xl text-sm font-semibold text-white",
          "transition-all hover:brightness-110",
          button,
        )}>
          {cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </Link>
    </div>
  );
}

export function AirdropSection() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md shadow-primary/20">
            <Rocket className="h-3.5 w-3.5 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">Creator Launchpad</h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/launchpad" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            All services <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 snap-x snap-mandatory pb-2" style={{ width: "max-content" }}>
          {FEATURES.map((f) => (
            <div key={f.label} className="w-64 sm:w-72 snap-start shrink-0">
              <ServiceCard feature={f} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
