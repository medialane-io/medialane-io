"use client";

import Link from "@medialane/ui/link";
import {
  CheckCircle2,
  XCircle,
  Shield,
  FileCheck,
  Coins,
  Star,
  Sparkles,
} from "lucide-react";
import { GenesisMint, AirdropEventCard } from "@/components/airdrop/genesis-mint";
import { msg, useT } from "@medialane/ui/i18n";
import { IconTile } from "@medialane/ui";

const EARN_GROUPS = [
  {
    icon: FileCheck,
    title: msg("Get started"),
    desc: msg("Sign up with your email. You're included from that point on, and it's the only requirement."),
  },
  {
    icon: Coins,
    title: msg("Create"),
    desc: msg("Mint, publish, launch collections or drops. Each action adds to your XP."),
  },
  {
    icon: Star,
    title: msg("Trade and engage"),
    desc: msg("Buy, sell, make offers, collaborate. This adds to the same XP total too."),
  },
];

export function AirdropContent() {
  const t = useT();
  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8">

      <section className="py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/5 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-brand-orange" />
              <span className="text-xs font-semibold text-brand-orange">{t("Creators Fund Campaign")}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              {t.rich("Creator's {fund}", { fund: <span className="text-brand-orange">{t("Fund")}</span> })}
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-md">
              {t("A share of what Medialane earns is set aside for the people building here. Sign up and you're already in.")}
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
          <h2 className="text-3xl sm:text-4xl font-black">{t("How you earn")}</h2>
          <p className="text-base text-muted-foreground mt-2 leading-relaxed">{t.rich("Every real interaction with Medialane earns XP, and your total XP relative to everyone else's decides your share of each distribution. Signing up is enough to be included; everything below adds to the same running total. See your exact score on the {link} page.", { link: <Link href="/rewards" className="text-foreground underline underline-offset-2 hover:text-brand-orange transition-colors">
              {t("Rewards")}
            </Link> })}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
          {EARN_GROUPS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col gap-3">
              <IconTile>
                <Icon />
              </IconTile>
              <p className="font-bold text-lg">{t(title)}</p>
              <p className="text-base text-muted-foreground leading-relaxed">{t(desc)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14 space-y-4">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black">{t("The Creator's Fund")}</h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {t("A share of what Medialane earns is set aside in one public wallet. Each time it reaches its threshold, it's airdropped to everyone taking part, split by XP. This runs through July 2027. Read the full mechanic and watch the live wallet at")}{" "}
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
        <h2 className="text-3xl sm:text-4xl font-black">{t("The fine print")}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          <div className="space-y-6">
            <div className="space-y-3">
              <p className="font-bold text-brand-blue">{t("Who can join")}</p>
              <div className="space-y-2.5">
                {[
                  msg("Anyone who creates a free Medialane account."),
                  msg("Approval-free, open to everyone."),
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-base text-muted-foreground leading-relaxed">{t(text)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-destructive/80">{t("What gets you removed")}</p>
              <div className="space-y-2.5">
                {[
                  msg("Automated bots or duplicate registrations."),
                  msg("Artificially inflating activity or scores."),
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <span className="text-base text-muted-foreground leading-relaxed">{t(text)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <p className="font-bold text-lg">{t("The legal stuff, in full")}</p>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              {t("We have to spell this out because we're a real platform. Here's the whole deal, no shortcuts:")}
            </p>
            <div className="space-y-3 text-base text-muted-foreground leading-relaxed">
              <p>{t("Medialane is a content publishing and creator rewards platform. This campaign is not a financial product, investment scheme, lottery, or gambling service.")}</p>
              <p>{t("Participation does not guarantee any financial return. Fund distributions, if any occur, may take the form of platform credits, digital assets, or other community resources.")}</p>
              <p>{t("The participation record is a digital record of community membership. It has no inherent monetary value and is not a financial instrument.")}</p>
              <p>{t.rich("By participating you agree to the {a} and {a2}.", { a: <a href="https://docs.medialane.io/guidelines/campaign-terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">{t("Campaign Terms")}</a>, a2: <a href="https://docs.medialane.io/guidelines/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">{t("Terms of Service")}</a> })}</p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
