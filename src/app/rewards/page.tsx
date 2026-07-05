import type { Metadata } from "next";
import { Trophy, Info } from "lucide-react";
import { PageContainer, ServiceHeader } from "@medialane/ui";
import { RewardsDashboard } from "./rewards-dashboard";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Rewards";
const description =
  "Your XP, rank, badges, and Creator's Fund airdrop share. Earn more by creating, collecting, and trading.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/rewards"),
  ...buildSocialMetadata({ title, description }),
};

export default function RewardsPage() {
  return (
    <PageContainer className="box-border max-w-full pt-20 pb-16 space-y-8">
      <ServiceHeader
        icon={<Trophy className="h-4 w-4 text-white" />}
        title="Rewards"
        subtitle="Earn XP by creating, collecting, and trading. Every $1,000 the Creator's Fund collects is airdropped back to participants — weighted by your score."
      />

      <RewardsDashboard />

      <footer className="rounded-2xl border border-border/40 bg-muted/20 px-5 py-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">
            Subject to DAO recalibration.
          </span>{" "}
          XP values, Score Board weights, and badge criteria may be adjusted by
          Medialane DAO governance to keep Creator&apos;s Fund airdrop
          distributions fair and sustainable. Final share at each round is
          determined when the round is executed on-chain.
        </p>
      </footer>
    </PageContainer>
  );
}
