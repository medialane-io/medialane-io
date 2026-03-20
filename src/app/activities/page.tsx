import type { Metadata } from "next";
import { ActivitiesFeed } from "./activities-feed";
import { Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "Activities",
  description: "Global marketplace activity on Medialane.",
};

export default function ActivitiesPage() {
  return (
    <div className="container mx-auto px-4 pt-14 pb-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Activity className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Activity</span>
        </div>
        <h1 className="text-3xl font-bold">Global Activity</h1>
        <p className="text-muted-foreground">Marketplace events — sales, listings, and offers.</p>
      </div>
      <ActivitiesFeed />
    </div>
  );
}
