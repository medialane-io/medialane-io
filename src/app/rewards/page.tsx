import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { RewardsDashboard } from "./rewards-dashboard";

export const metadata: Metadata = {
  title: "Rewards — Medialane",
  description: "Your XP, rank, and badges. Earn more by creating, collecting, and trading.",
};

export default function RewardsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 pt-10 pb-20 max-w-3xl">
      <div className="mb-8 space-y-1">
        <div className="flex items-center gap-2.5">
          <Trophy className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Rewards</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Earn XP by creating, collecting, and trading. Level up to unlock recognition.
        </p>
      </div>
      <RewardsDashboard />
    </div>
  );
}
