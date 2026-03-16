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
    glow: "shadow-yellow-500/15",
    border: "border-yellow-500/15",
  },
  {
    icon: Rocket,
    title: "Creator Launchpad",
    body: "Launch and mint NFT Collections, Programmable IP, and Real World Assets — all in a few clicks.",
    accent: "from-violet-400 to-purple-500",
    glow: "shadow-violet-500/15",
    border: "border-violet-500/15",
  },
  {
    icon: Store,
    title: "NFT Marketplace",
    body: "Monetize and trade digital assets with smart-contract security. Earn royalties on every secondary sale.",
    accent: "from-blue-400 to-cyan-400",
    glow: "shadow-blue-500/15",
    border: "border-blue-500/15",
  },
  {
    icon: Fingerprint,
    title: "Immutable Provenance",
    body: "Secure your intellectual property copyright with blockchain-based, timestamped proof of ownership.",
    accent: "from-emerald-400 to-teal-400",
    glow: "shadow-emerald-500/15",
    border: "border-emerald-500/15",
  },
  {
    icon: ShieldCheck,
    title: "Censorship Resistance",
    body: "Ensure your content remains permanently accessible and immutable on-chain. No central authority can remove it.",
    accent: "from-rose-400 to-pink-400",
    glow: "shadow-rose-500/15",
    border: "border-rose-500/15",
  },
  {
    icon: Lock,
    title: "Onchain Sovereignty",
    body: "Maintain complete control over your intellectual property with fully self-custodied, user-owned assets.",
    accent: "from-indigo-400 to-blue-400",
    glow: "shadow-indigo-500/15",
    border: "border-indigo-500/15",
  },
  {
    icon: Globe2,
    title: "Global Protection",
    body: "Compliant with the Berne Convention (1886) — guaranteeing authorship recognition across 181 countries.",
    accent: "from-sky-400 to-blue-500",
    glow: "shadow-sky-500/15",
    border: "border-sky-500/15",
  },
  {
    icon: Bolt,
    title: "Atomic Settlement",
    body: "Asset transfer and payment happen simultaneously in a single transaction. No escrow, no counterparty risk.",
    accent: "from-amber-400 to-yellow-400",
    glow: "shadow-amber-500/15",
    border: "border-amber-500/15",
  },
  {
    icon: FileCode2,
    title: "Embedded Licensing",
    body: "Usage terms are encoded directly into the asset — commercial use, derivatives, territory, AI policy and more.",
    accent: "from-fuchsia-400 to-pink-500",
    glow: "shadow-fuchsia-500/15",
    border: "border-fuchsia-500/15",
  },
  {
    icon: Cpu,
    title: "Onchain Composability",
    body: "Machine-readable IP permissions let games, AI models, and dApps automatically query and interact on-chain.",
    accent: "from-teal-400 to-emerald-400",
    glow: "shadow-teal-500/15",
    border: "border-teal-500/15",
  },
  {
    icon: Unlink,
    title: "Claim Any Collection",
    body: "Medialane works with any ERC-721 compatible contract. Claim and manage existing collections on Starknet.",
    accent: "from-orange-400 to-rose-400",
    glow: "shadow-orange-500/15",
    border: "border-orange-500/15",
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
    shadow: "shadow-violet-500/25",
    ring: "hover:ring-violet-500/30",
  },
  {
    href: "/create/collection",
    icon: Layers,
    label: "Deploy Collection",
    description:
      "Launch a named NFT collection, set royalties, upload cover art and start minting assets into it instantly.",
    gradient: "from-blue-500 to-cyan-500",
    shadow: "shadow-blue-500/25",
    ring: "hover:ring-blue-500/30",
  },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreatePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Dark atmospheric background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#07000f] via-background to-background" />

      {/* Aurora glows */}
      <div
        className="aurora-purple absolute w-[70%] max-w-[700px] h-[50%] max-h-[500px] -top-1/4 -left-1/4 pointer-events-none"
        style={{ opacity: 0.18 }}
      />
      <div
        className="aurora-blue absolute w-[50%] max-w-[500px] h-[40%] max-h-[400px] top-0 -right-1/4 pointer-events-none"
        style={{ opacity: 0.12 }}
      />

      {/* Horizon glow line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-16">

        {/* ── Hero ── */}
        <div className="max-w-2xl space-y-5">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm font-semibold text-violet-300 backdrop-blur-sm">
            <Rocket className="h-3.5 w-3.5" />
            Creator Studio
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.06] tracking-tight text-white">
            Protect, manage &amp;{" "}
            <span className="gradient-text">unlock revenue</span>{" "}
            for your IP.
          </h1>

          <p className="text-base sm:text-lg text-white/50 leading-relaxed max-w-lg">
            Medialane empowers creators with unique monetization services —
            gasless, global, and permanently yours on Starknet.
          </p>
        </div>

        {/* ── Action cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
          {ACTIONS.map(({ href, icon: Icon, label, description, gradient, shadow, ring }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm ring-2 ring-transparent transition-all duration-300",
                "hover:bg-white/[0.07] hover:border-white/[0.14]",
                ring
              )}
            >
              {/* Gradient icon */}
              <div
                className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg mb-5 transition-transform duration-300 group-hover:scale-110",
                  gradient,
                  shadow
                )}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>

              <h2 className="text-lg font-bold text-white mb-2">{label}</h2>
              <p className="text-sm text-white/50 leading-relaxed">{description}</p>

              <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-white/60 group-hover:text-white transition-colors">
                Get started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[11px] uppercase tracking-widest text-white/25 font-semibold">
            Platform Features
          </span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* ── Features grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, body, accent, glow, border }) => (
            <div
              key={title}
              className={cn(
                "relative rounded-2xl border p-5 backdrop-blur-sm bg-white/[0.02] space-y-3 transition-all duration-300 hover:bg-white/[0.05] group",
                border
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg",
                  accent,
                  glow
                )}
              >
                <Icon className="h-4.5 w-4.5 text-white h-[18px] w-[18px]" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-sm text-white/90">{title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom stat strip ── */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm p-6 sm:p-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {[
              { value: "181", label: "Countries protected" },
              { value: "Free", label: "to mint & list" },
              { value: "Gas-free", label: "transactions" },
              { value: "On-chain", label: "royalties & licensing" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center space-y-1">
                <p className="text-2xl sm:text-3xl font-black text-white">{value}</p>
                <p className="text-[11px] uppercase tracking-widest text-white/35 font-medium">
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
