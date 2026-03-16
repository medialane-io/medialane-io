import type { Metadata } from "next";
import Link from "next/link";
import {
  ImagePlus,
  Layers,
  Zap,
  Rocket,
  Store,
  Fingerprint,
  ShieldCheck,
  Globe2,
  Bolt,
  FileCode2,
  Cpu,
  Unlink,
  Lock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Creator Studio · Medialane",
  description:
    "Protect, manage and unlock new revenue streams for your Intellectual Property.",
};

// ── Feature definitions ──────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Zap,
    title: "Frictionless Web3",
    body: "Gasless transactions and invisible wallets with Google login powered by ChipiPay. Zero crypto knowledge required.",
    accent: "from-yellow-400 to-orange-400",
    border: "border-yellow-500/20",
    bg: "bg-yellow-500/5",
  },
  {
    icon: Rocket,
    title: "Creator Launchpad",
    body: "Launch and mint NFT Collections, Programmable IP, and Real World Assets — all in a few clicks.",
    accent: "from-violet-500 to-purple-600",
    border: "border-violet-500/20",
    bg: "bg-violet-500/5",
  },
  {
    icon: Store,
    title: "NFT Marketplace",
    body: "Monetize and trade digital assets with smart-contract security. Earn royalties on every secondary sale.",
    accent: "from-blue-400 to-cyan-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
  },
  {
    icon: Fingerprint,
    title: "Immutable Provenance",
    body: "Secure your intellectual property copyright with blockchain-based, timestamped proof of ownership.",
    accent: "from-emerald-400 to-teal-500",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
  },
  {
    icon: ShieldCheck,
    title: "Censorship Resistance",
    body: "Ensure your content remains permanently accessible and immutable on-chain. No central authority can remove it.",
    accent: "from-rose-400 to-pink-500",
    border: "border-rose-500/20",
    bg: "bg-rose-500/5",
  },
  {
    icon: Lock,
    title: "Onchain Sovereignty",
    body: "Maintain complete control over your intellectual property with fully self-custodied, user-owned assets.",
    accent: "from-indigo-400 to-blue-500",
    border: "border-indigo-500/20",
    bg: "bg-indigo-500/5",
  },
  {
    icon: Globe2,
    title: "Global Protection",
    body: "Compliant with the Berne Convention (1886) — guaranteeing authorship recognition across 181 countries.",
    accent: "from-sky-400 to-blue-500",
    border: "border-sky-500/20",
    bg: "bg-sky-500/5",
  },
  {
    icon: Bolt,
    title: "Atomic Settlement",
    body: "Asset transfer and payment happen simultaneously in a single transaction. No escrow, no counterparty risk.",
    accent: "from-amber-400 to-yellow-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
  },
  {
    icon: FileCode2,
    title: "Embedded Licensing",
    body: "Usage terms are encoded directly into the asset — commercial use, derivatives, territory, AI policy and more.",
    accent: "from-fuchsia-400 to-pink-500",
    border: "border-fuchsia-500/20",
    bg: "bg-fuchsia-500/5",
  },
  {
    icon: Cpu,
    title: "Onchain Composability",
    body: "Machine-readable IP permissions let games, AI models, and dApps automatically query and interact on-chain.",
    accent: "from-teal-400 to-emerald-400",
    border: "border-teal-500/20",
    bg: "bg-teal-500/5",
  },
  {
    icon: Unlink,
    title: "Claim Any Collection",
    body: "Medialane works with any ERC-721 compatible contract. Claim and manage existing collections on Starknet.",
    accent: "from-orange-400 to-rose-400",
    border: "border-orange-500/20",
    bg: "bg-orange-500/5",
  },
] as const;

// ── CTA cards ─────────────────────────────────────────────────────────────────

const ACTIONS = [
  {
    href: "/create/asset",
    icon: ImagePlus,
    label: "Mint IP Asset",
    description:
      "Upload any creative work — art, music, document or file — and anchor it on-chain as a programmable IP asset.",
    gradient: "from-violet-500 to-purple-600",
    ring: "hover:ring-violet-500/30",
    iconBg: "bg-violet-500/10 group-hover:bg-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    href: "/create/collection",
    icon: Layers,
    label: "Deploy Collection",
    description:
      "Launch a named NFT collection, set royalties, upload cover art and start minting assets into it instantly.",
    gradient: "from-blue-500 to-cyan-500",
    ring: "hover:ring-blue-500/30",
    iconBg: "bg-blue-500/10 group-hover:bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreatePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Subtle background tint — visible in dark mode, near-invisible in light */}
      <div className="absolute inset-0 dark:bg-gradient-to-b dark:from-[#07000f]/80 dark:via-transparent dark:to-transparent pointer-events-none" />

      {/* Aurora — dark-only decorative glows */}
      <div
        className="aurora-purple absolute w-[70%] max-w-[700px] h-[50%] max-h-[500px] -top-1/4 -left-1/4 pointer-events-none hidden dark:block"
        style={{ opacity: 0.18 }}
      />
      <div
        className="aurora-blue absolute w-[50%] max-w-[500px] h-[40%] max-h-[400px] top-0 -right-1/4 pointer-events-none hidden dark:block"
        style={{ opacity: 0.12 }}
      />

      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 space-y-12 sm:space-y-16">

        {/* ── Hero ── */}
        <div className="max-w-2xl space-y-4 sm:space-y-5">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm font-semibold text-violet-700 dark:text-violet-300 backdrop-blur-sm">
            <Rocket className="h-3.5 w-3.5" />
            Creator Studio
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.06] tracking-tight text-foreground">
            Mint, protect &amp;{" "}
            <span className="gradient-text">generate revenue</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
            Unique monetization services — gasless, global, and truly yours on Starknet.
          </p>
        </div>

        {/* ── Action cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-2xl">
          {ACTIONS.map(({ href, icon: Icon, label, description, ring, iconBg, iconColor }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative rounded-2xl border border-border bg-card p-5 sm:p-6 ring-2 ring-transparent transition-all duration-300",
                "hover:border-border/80 hover:shadow-lg hover:shadow-primary/5",
                ring
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "h-11 w-11 rounded-xl flex items-center justify-center mb-4 sm:mb-5 transition-all duration-300 group-hover:scale-110",
                  iconBg
                )}
              >
                <Icon className={cn("h-5 w-5", iconColor)} />
              </div>

              <h2 className="text-base sm:text-lg font-bold text-foreground mb-2">{label}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

              <div className="mt-4 sm:mt-5 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                Get started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-semibold whitespace-nowrap">
            Platform Features
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* ── Features grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {FEATURES.map(({ icon: Icon, title, body, accent, border, bg }) => (
            <div
              key={title}
              className={cn(
                "relative rounded-2xl border p-4 sm:p-5 space-y-3 transition-all duration-200 hover:shadow-sm group",
                border,
                bg
              )}
            >
              {/* Gradient icon */}
              <div
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm",
                  accent
                )}
              >
                <Icon className="h-[18px] w-[18px] text-white" />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-sm text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Stats strip ── */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-8">
            {[
              { value: "181", label: "Countries protected" },
              { value: "Free", label: "to mint & list" },
              { value: "Gas-free", label: "transactions" },
              { value: "On-chain", label: "royalties & licensing" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center space-y-1">
                <p className="text-2xl sm:text-3xl font-black text-foreground">{value}</p>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground/70 font-medium">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
