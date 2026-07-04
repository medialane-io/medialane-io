import type { Metadata } from "next";
import { ActivitiesFeed } from "./activities-feed";
import { Activity } from "lucide-react";
import { PageContainer } from "@medialane/ui";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Activities";
const description = "Global marketplace activity on Medialane.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/activities"),
  ...buildSocialMetadata({ title, description }),
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
