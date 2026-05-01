import type { Metadata } from "next";
import Link from "next/link";
import {
  Gift,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  PenLine,
  ShoppingCart,
  Zap,
  Vote,
  Star,
  Trophy,
} from "lucide-react";
import { MedialaneLogo } from "@/components/brand/medialane-logo";

export const metadata: Metadata = {
  title: "Creator's Airdrop — Medialane",
  description:
    "Everything you need to know about the Medialane Creator's Airdrop — how participation works, what you earn, and how to join.",
};

const TIERS = [
  {
    icon: UserCheck,
    tier: "Tier 1 — Register",
    label: "Base share",
    colorClass: "text-blue-400",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/20",
    actions: [
      "Create a free account",
      "Secure your account with a PIN or passkey",
    ],
    desc: "Every participant who completes onboarding qualifies. This is the floor — you participate and receive a base share of each distribution.",
  },
  {
    icon: PenLine,
    tier: "Tier 2 — Create",
    label: "Higher share",
    colorClass: "text-purple-400",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/20",
    actions: [
      "Publish at least one piece of original content",
      "Set up a collection or creator profile",
    ],
    desc: "Creators who publish original work receive a meaningfully larger share. The platform exists because of what you create.",
  },
  {
    icon: ShoppingCart,
    tier: "Tier 3 — Engage",
    label: "Largest share",
    colorClass: "text-orange-400",
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/20",
    actions: [
      "Trade, collect, or make offers on the marketplace",
      "Collaborate or remix with other creators",
      "Consistent activity across multiple cycles",
    ],
    desc: "Active participants who both create and engage with the broader community receive the highest contribution scores.",
  },
];

const PHASES = [
  {
    phase: "Phase 1",
    trigger: "5,000 participants",
    items: [
      "First distribution from the creator fund",
      "Community vote ratifies the allocation amount",
      "All eligible participants receive their proportional share",
    ],
  },
  {
    phase: "Phase 2",
    trigger: "10,000 participants",
    items: [
      "Second distribution — includes revenue since Phase 1",
      "Community vote determines the allocation and rules",
      "Contribution scores re-calculated from all activity since launch",
    ],
  },
  {
    phase: "Annual cycle",
    trigger: "Every year, ongoing",
    items: [
      "Yearly community allocation voted on via governance",
      "100% of platform revenue for the year added to the pool",
      "The cycle repeats — Medialane has no investors drawing revenue",
    ],
  },
];

export default function AirdropPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/30 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <MedialaneLogo />
        <nav className="hidden sm:flex items-center gap-1">
          <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50">
            Marketplace
          </Link>
          <Link href="/airdrop#participate" className="text-sm font-semibold text-foreground bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-lg">
            Join now
          </Link>
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-5 max-w-3xl py-12 space-y-16">

        {/* Hero */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5">
            <Gift className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary/70">Community Program</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
            Creator&apos;s{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Airdrop
            </span>
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed max-w-xl mx-auto">
            The Medialane Creator&apos;s Airdrop distributes platform revenue directly to the people who build and use the platform — creators, collectors, and active participants. There are no investors extracting revenue. What the platform earns goes back to the community.
          </p>
        </div>

        {/* Model */}
        <div className="rounded-2xl border border-border/40 bg-muted/10 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">The model</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Each year, the Medialane community votes on how to allocate that year&apos;s airdrop pool. The pool consists of platform revenue from the previous year plus the annual community allocation approved by governance. The community — not the founding team — decides the amount and distribution rules every cycle.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {[
              { label: "Platform revenue", value: "100% to fund" },
              { label: "Governed by",      value: "Community vote" },
              { label: "Cycle",            value: "Annual + milestones" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/30 rounded-lg px-4 py-3 space-y-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tiers */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-black mb-1">How participation works</h2>
            <p className="text-sm text-muted-foreground">
              Your contribution score determines your proportional share of each distribution. The more you create and engage, the larger your share.
            </p>
          </div>
          <div className="space-y-4">
            {TIERS.map(({ icon: Icon, tier, label, colorClass, bgClass, borderClass, actions, desc }) => (
              <div key={tier} className={`rounded-2xl border ${borderClass} bg-card/30 p-5 space-y-3`}>
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl ${bgClass} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`h-5 w-5 ${colorClass}`} />
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm">{tier}</p>
                      <span className={`text-xs font-semibold ${colorClass}`}>{label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
                <ul className="space-y-1.5 pl-13">
                  {actions.map((a) => (
                    <li key={a} className="flex items-start gap-2 text-xs text-muted-foreground pl-1">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/50" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-4">
          <h2 className="text-xl font-black">Distribution phases</h2>
          <div className="space-y-3">
            {PHASES.map(({ phase, trigger, items }) => (
              <div key={phase} className="rounded-2xl border border-border/40 bg-card/30 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold text-sm">{phase}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{trigger}</span>
                </div>
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/40" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Fair by design */}
        <div className="rounded-2xl border border-border/40 bg-muted/10 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Fair by design</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All participation is recorded on a public, decentralized network — the same infrastructure that makes Medialane permissionless and censorship-resistant. Contribution scores are verifiable and tamper-proof. Accounts found using automated tools or duplicate registrations are disqualified. The fund rewards real creative work, not gaming.
          </p>
        </div>

        {/* Governance */}
        <div className="rounded-2xl border border-border/40 bg-muted/10 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Vote className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Community governance</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every distribution is ratified by a community governance vote before it happens. MDLN token holders decide the amount, the rules, and the timing. If the community votes to increase or decrease the fund for a given year, that decision stands.
          </p>
          <a
            href="https://docs.medialane.io/dao/governance"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Read the Governance Charter <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* CTA */}
        <div id="participate" className="space-y-4 pb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h2 className="text-xl font-black">Join the airdrop</h2>
            </div>
            <p className="text-sm text-muted-foreground">Choose your campaign and claim your participation record.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/mint"
              className="group rounded-2xl border border-border/50 bg-card/50 hover:border-primary/40 hover:bg-muted/20 transition-all p-5 flex items-center justify-between gap-3"
            >
              <div>
                <p className="font-bold text-sm">Global campaign</p>
                <p className="text-xs text-muted-foreground mt-0.5">Creator&apos;s Airdrop — worldwide, in English</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
            <Link
              href="/br/mint"
              className="group rounded-2xl border border-border/50 bg-card/50 hover:border-primary/40 hover:bg-muted/20 transition-all p-5 flex items-center justify-between gap-3"
            >
              <div>
                <p className="font-bold text-sm">Campanha Brasil</p>
                <p className="text-xs text-muted-foreground mt-0.5">Airdrop de Prêmios — em português</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          </div>
          <p className="text-[11px] text-center text-muted-foreground/50">
            Free participation · No purchase required · Fund distribution governed by Medialane DAO ·{" "}
            <Link href="/campaign-terms" className="underline underline-offset-2 hover:text-muted-foreground/80 transition-colors">
              Campaign terms
            </Link>
          </p>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="px-6 py-4 flex items-center justify-center gap-5 text-xs text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/campaign-terms" className="hover:text-foreground transition-colors">Campaign</Link>
          <a href="https://docs.medialane.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Docs</a>
          <span>© {new Date().getFullYear()} Medialane</span>
        </div>
      </footer>
    </div>
  );
}
