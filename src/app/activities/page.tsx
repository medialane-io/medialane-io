import type { Metadata } from "next";
import { ActivitiesFeed } from "./activities-feed";
import { Activity } from "lucide-react";
import { PageContainer } from "@medialane/ui";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Activities",
  description: "Global marketplace activity on Medialane.",
  alternates: canonical("/activities"),
};

export default function ActivitiesPage() {
  return (
    <PageContainer className="box-border max-w-full pt-14 pb-8 space-y-8">
      <div className="space-y-2 pt-8">
        <h1 className="text-3xl font-bold">Onchain Activity</h1>        
      </div>
      <ActivitiesFeed />
    </PageContainer>
  );
}
