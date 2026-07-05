import type { Metadata } from "next";
import { Info } from "lucide-react";
import { PageContainer } from "@medialane/ui";
import { RewardsDashboard } from "./rewards-dashboard";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Rewards";
const description =
  "What Medialane gives back to everyone creating, collecting, and taking part.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/rewards"),
  ...buildSocialMetadata({ title, description }),
};

export default function RewardsPage() {
  return (
    <PageContainer className="box-border max-w-full pt-20 pb-16 space-y-8">
      <RewardsDashboard />

      <footer className="rounded-2xl border border-border/40 bg-muted/20 px-5 py-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          The community can adjust point values and badge criteria over time to
          keep the fund fair as Medialane grows. Your share for each round is
          set when that round is paid out.
        </p>
      </footer>
    </PageContainer>
  );
}
