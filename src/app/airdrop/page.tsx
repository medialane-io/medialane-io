import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Info,
  Shield,
  FileCheck,
  Coins,
  Star,
  UserCheck,
  PenLine,
  ShoppingCart,
} from "lucide-react";
import { GenesisMint, AirdropEventCard } from "@/components/airdrop/genesis-mint";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Creator's Airdrop — Medialane",
  description: "Everything you need to know about the Medialane Creator's Airdrop — how participation works, what you earn, and how to join.",
  alternates: canonical("/airdrop"),
  openGraph: {
    title: "Creator's Airdrop — Medialane",
    description: "Everything you need to know about the Medialane Creator's Airdrop — how participation works, what you earn, and how to join.",
    url: "/airdrop",
    type: "website",
  },
};

const REWARDS = [
  {
    icon: FileCheck,
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
    title: "Airdrop participation",
    desc: "Medialane will run airdrop campaigns to reward early supporters. By joining now, you secure your spot in the first distribution and future rewards.",
  },
  {
    icon: Coins,
    color: "text-brand-orange",
    bg: "bg-brand-orange/10",
    title: "Creator fund distributions",
    desc: "Each time the Creator's Fund reaches $1,000, it is distributed to participants by Score Board points. The more you contribute, the larger your share.",
  },
  {
    icon: Star,
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
    title: "Founding member status",
    desc: "Early participants are permanently recognized as founding members of the community.",
  },
];

const PHASES = [
  {
    label: "Distribution rounds",
    milestone: "Every $1,000",
    desc: "Each time the Creator's Fund reaches $1,000, that amount is airdropped to all participants. Every dollar of revenue is returned — $5,000 means 5 rounds, $10,000 means 10.",
    gradient: "from-brand-blue to-brand-purple",
  },
  {
    label: "Your share",
    milestone: "Score Board points",
    desc: "Each round is split by Score Board points. You earn points by creating, trading, and engaging on Medialane — your points are your share of every distribution.",
    gradient: "from-brand-purple to-brand-rose",
  },
];

export default function AirdropPage() {
  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8">

      {/* ── Hero ── */}
      <section className="py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/5 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-brand-orange" />
              <span className="text-xs font-semibold text-brand-orange">Creators Fund Campaign</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              Creator&apos;s{" "}
              <span className="bg-gradient-to-r from-brand-blue via-brand-purple to-brand-orange bg-clip-text text-transparent">
                Fund
              </span>
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground leading-relaxed">
              Join the Creator&apos;s Airdrop to earn rewards. Sign up, create, trade, and grow with us from day one.
            </p>

            <GenesisMint />
          </div>

          <div className="space-y-4">
            <AirdropEventCard />
          </div>

        </div>
      </section>

      {/* ── Airdrop rewards ── */}
      <section className="py-10 border-t border-border/30 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Rewards</p>
          <h2 className="text-2xl sm:text-3xl font-black">What early participants earn</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Exclusive to participants who join during the launch campaign.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {REWARDS.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex flex-col gap-4 p-5 rounded-2xl border border-border/40 bg-card/30 hover:bg-card/50 transition-colors">
              <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="font-bold">{title}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Participation tiers ── */}
      <section className="py-10 border-t border-border/30 space-y-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">How it works</p>
          <h2 className="text-2xl sm:text-3xl font-black">Sign up. That&apos;s it.</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Creating an account is all you need to be eligible. Do more — earn more.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <UserCheck className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-black text-lg">Register</p>
                <span className="text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">Minimum — you&apos;re in</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Sign up and claim your record. That&apos;s the only requirement to participate in the airdrop.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border/40 bg-card/30 p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-purple/10 flex items-center justify-center">
                <PenLine className="h-5 w-5 text-brand-purple" />
              </div>
              <span className="text-xs font-semibold text-brand-purple bg-brand-purple/10 px-2.5 py-1 rounded-full">Bonus</span>
            </div>
            <div>
              <p className="font-bold">Create content</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Publish original work — photos, music, art, or writing. Creators get a larger share of each distribution.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/40 bg-card/30 p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-brand-orange" />
              </div>
              <span className="text-xs font-semibold text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-full">Biggest bonus</span>
            </div>
            <div>
              <p className="font-bold">Trade &amp; collect</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Buy, sell, and collaborate with other creators. Active participants receive the highest share.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Distribution phases ── */}
      <section className="py-10 border-t border-border/30 space-y-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Distribution</p>
          <h2 className="text-2xl sm:text-3xl font-black">How distribution works</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Every $1,000 the Creator&apos;s Fund collects is airdropped to participants — weighted by Score Board points.
            See how XP determines your share on the{" "}
            <Link href="/rewards" className="text-foreground underline underline-offset-2 hover:text-brand-orange transition-colors">
              Rewards
            </Link>{" "}
            page.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PHASES.map(({ label, milestone, desc, gradient }) => (
            <div key={label} className="relative rounded-2xl border border-border/40 bg-card overflow-hidden p-5 space-y-3">
              <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${gradient}`} />
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-lg">{label}</p>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground">{milestone}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border/40 bg-muted/10 p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Creator&apos;s Airdrop campaign runs until July 1, 2027. All platform revenue collected during that window is returned to participants.
          </p>
        </div>
        <a
          href="https://medialane.org/creators-fund"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-border/40 bg-muted/10 p-4 flex items-start gap-3 hover:border-border transition-colors"
        >
          <Coins className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Creator&apos;s Fund is a public wallet — track its live balance and every airdrop at <span className="text-foreground font-medium">medialane.org/creators-fund</span>.
            <span className="block tabular-nums text-xs mt-1 break-all">0x064c51746dbcb7498cc6e4b8abfcacd60805c0762b0411bb0515c611b5ae8223</span>
          </p>
        </a>
      </section>

      {/* ── Rules + Disclaimer ── */}
      <section className="py-10 border-t border-border/30 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Rules</p>
              <h2 className="text-2xl font-black">Participation rules</h2>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-blue">Who can join</p>
              <div className="space-y-2">
                {[
                  "Anyone who creates a free Medialane account.",
                  "No ID, no card, no approval required.",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    </div>
                    <span className="text-sm text-muted-foreground leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-destructive/70">What gets you removed</p>
              <div className="space-y-2">
                {[
                  "Automated bots or duplicate registrations.",
                  "Artificially inflating activity or scores.",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                      <XCircle className="h-3 w-3 text-destructive" />
                    </div>
                    <span className="text-sm text-muted-foreground leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-2xl font-black">Disclaimer</h2>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>Medialane is a content publishing and creator rewards platform. This campaign is not a financial product, investment scheme, lottery, or gambling service.</p>
              <p>Participation does not guarantee any financial return. Fund distributions, if any occur, may take the form of platform credits, digital assets, or other community resources.</p>
              <p>The participation record is a digital record of community membership. It has no inherent monetary value and is not a financial instrument.</p>
              <p>
                By participating you agree to the{" "}
                <a href="https://docs.medialane.io/guidelines/campaign-terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">Campaign Terms</a>
                {" "}and{" "}
                <a href="https://docs.medialane.io/guidelines/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms of Service</a>.
              </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
