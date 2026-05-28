import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { PageContainer } from "@medialane/ui";
import { RewardsDashboard } from "./rewards-dashboard";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Rewards — Medialane",
  description:
    "Your XP, rank, badges, and Creator's Fund airdrop share. Earn more by creating, collecting, and trading.",
  alternates: canonical("/rewards"),
};

export default function RewardsPage() {
  return (
    <PageContainer className="box-border max-w-full pt-20 pb-16 space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2.5">
          <Trophy className="h-5 w-5 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Rewards</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Earn XP by creating, collecting, and trading. Every $1,000 the Creator&apos;s
          Fund collects is airdropped back to participants — weighted by your score.
        </p>
      </header>

      <RewardsDashboard />
    </PageContainer>
  );
}
