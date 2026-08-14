"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { LevelJourneyList, BadgeCatalog } from "@medialane/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { useRewardsConfig } from "@/hooks/use-rewards";

const EXAMPLE_ACTION_TYPES = [
  "mint_asset", "buy_asset", "create_collection", "comment",
  "launch_launchpad", "make_offer", "join_club", "list_asset",
];

function Hero() {
  return (
    <section className="py-14 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange to-brand-maeve text-white shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.02]">
          Your{" "}
          <span className="bg-gradient-to-r from-brand-orange to-brand-maeve bg-clip-text text-transparent">
            Journey
          </span>
        </h1>
      </div>
      <p className="text-lg text-foreground/70 max-w-xl leading-relaxed font-medium">
        Every level, every badge, every way to earn — the whole system, in one place. Check{" "}
        <Link href="/rewards" className="text-foreground underline underline-offset-2 hover:text-brand-orange transition-colors">
          your own score
        </Link>{" "}
        on Rewards.
      </p>
    </section>
  );
}

function LevelsSection() {
  const { data: config, isLoading } = useRewardsConfig();
  return (
    <section className="py-14 space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight">The Level Ladder</h2>
        <p className="text-base text-foreground/60 mt-1.5 font-medium">50 levels, from Starter to Genesis.</p>
      </div>
      {isLoading || !config ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <LevelJourneyList levels={config.levels} />
      )}
    </section>
  );
}

function HowXpWorksSection() {
  const { data: config, isLoading } = useRewardsConfig();
  const examples = config?.actions.filter((a) => EXAMPLE_ACTION_TYPES.includes(a.type)) ?? [];

  return (
    <section className="py-14 space-y-6">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-black tracking-tight">How XP works</h2>
        <p className="text-base text-foreground/60 mt-1.5 font-medium leading-relaxed">
          Every action earns real XP, automatically — no buying points, no gaming the system.
          Some early actions and loyalty count extra.
        </p>
      </div>
      {isLoading || !config ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {examples.map((a) => (
            <div key={a.type} className="rounded-2xl bg-foreground/[0.04] p-4">
              <p className="text-lg font-black text-brand-orange">+{a.xp}</p>
              <p className="text-xs font-semibold text-foreground/60 mt-1 leading-snug">{a.label}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function BadgesSection() {
  const { data: config, isLoading } = useRewardsConfig();
  return (
    <section className="py-14 space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight">Badges</h2>
        <p className="text-base text-foreground/60 mt-1.5 font-medium">What&apos;s achievable, not just what you&apos;ve done.</p>
      </div>
      {isLoading || !config ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <BadgeCatalog badges={config.badges} />
      )}
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-14 pb-20 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Link
        href="/connect"
        className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-brand-orange to-brand-maeve p-6 text-white"
      >
        <div>
          <p className="font-black text-lg">New here?</p>
          <p className="text-sm font-medium text-white/80">Get started in seconds.</p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0" />
      </Link>
      <Link
        href="/rewards"
        className="flex items-center justify-between rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.07] p-6 transition-colors"
      >
        <div>
          <p className="font-black text-lg">Already earning?</p>
          <p className="text-sm font-medium text-foreground/60">Check your score.</p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0" />
      </Link>
    </section>
  );
}

export function JourneyContent() {
  return (
    <>
      <Hero />
      <LevelsSection />
      <HowXpWorksSection />
      <BadgesSection />
      <CtaSection />
    </>
  );
}
