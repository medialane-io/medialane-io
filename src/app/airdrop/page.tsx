import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Shield,
  FileCheck,
  Coins,
  Star,
} from "lucide-react";
import { GenesisMint, AirdropEventCard } from "@/components/airdrop/genesis-mint";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Creator's Airdrop | Medialane",
  description: "How the Medialane Creator's Airdrop works: what earns XP, how distributions happen, and how to join.",
  alternates: canonical("/airdrop"),
  openGraph: {
    title: "Creator's Airdrop | Medialane",
    description: "How the Medialane Creator's Airdrop works: what earns XP, how distributions happen, and how to join.",
    url: "/airdrop",
    type: "website",
  },
};

const EARN_GROUPS = [
  {
    icon: FileCheck,
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
    title: "Get started",
    desc: "Sign up with your email. You're included from that point on, and it's the only requirement.",
  },
  {
    icon: Coins,
    color: "text-brand-orange",
    bg: "bg-brand-orange/10",
    title: "Create",
    desc: "Mint, publish, launch collections or drops. Each action adds to your XP.",
  },
  {
    icon: Star,
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
    title: "Trade and engage",
    desc: "Buy, sell, make offers, collaborate. This adds to the same XP total too.",
  },
];

export default function AirdropPage() {
  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8">

      <section className="py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/5 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-brand-orange" />
              <span className="text-xs font-semibold text-brand-orange">Creators Fund Campaign</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              Creator&apos;s <span className="text-brand-orange">Fund</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-md">
              A share of what Medialane earns is set aside for the people building here. Sign up and you&apos;re already in.
            </p>

            <GenesisMint />
          </div>

          <div className="space-y-4">
            <AirdropEventCard />
          </div>

        </div>
      </section>

      <section className="py-14 space-y-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-black">How you earn</h2>
          <p className="text-base text-muted-foreground mt-2 leading-relaxed">
            Every real interaction with Medialane earns XP, and your total XP relative to
            everyone else&apos;s decides your share of each distribution. Signing up is enough
            to be included; everything below adds to the same running total. See your exact
            score on the{" "}
            <Link href="/rewards" className="text-foreground underline underline-offset-2 hover:text-brand-orange transition-colors">
              Rewards
            </Link>{" "}
            page.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
          {EARN_GROUPS.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex flex-col gap-3">
              <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <p className="font-bold text-lg">{title}</p>
              <p className="text-base text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14 space-y-4">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black">The Creator&apos;s Fund</h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            A share of what Medialane earns is set aside in one public wallet. Each time it
            reaches its threshold, it&apos;s airdropped to everyone taking part, split by XP.
            This runs through July 2027. Read the full mechanic and watch the live wallet at{" "}
            <a
              href="https://medialane.org/creators-fund"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-brand-orange transition-colors"
            >
              medialane.org/creators-fund
            </a>
            .
          </p>
          <span className="block tabular-nums text-sm text-muted-foreground/70 break-all">0x064c51746dbcb7498cc6e4b8abfcacd60805c0762b0411bb0515c611b5ae8223</span>
        </div>
      </section>

      <section className="py-14 pb-16 space-y-8">
        <h2 className="text-3xl sm:text-4xl font-black">The fine print</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          <div className="space-y-6">
            <div className="space-y-3">
              <p className="font-bold text-brand-blue">Who can join</p>
              <div className="space-y-2.5">
                {[
                  "Anyone who creates a free Medialane account.",
                  "Approval-free, open to everyone.",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-base text-muted-foreground leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-destructive/80">What gets you removed</p>
              <div className="space-y-2.5">
                {[
                  "Automated bots or duplicate registrations.",
                  "Artificially inflating activity or scores.",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <span className="text-base text-muted-foreground leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <p className="font-bold text-lg">The legal stuff, in full</p>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              We have to spell this out because we&apos;re a real platform. Here&apos;s the whole deal, no shortcuts:
            </p>
            <div className="space-y-3 text-base text-muted-foreground leading-relaxed">
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
