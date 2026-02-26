import type { Metadata } from "next";
import { ActivitiesFeed } from "./activities-feed";
import { Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "Activities",
  description: "Global marketplace activity on Medialane.",
};

export default function ActivitiesPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h1 className="text-3xl font-bold">Activity</h1>
      </div>
      <p className="text-muted-foreground">Global marketplace events — sales, listings, and offers.</p>
      <ActivitiesFeed />
    </div>
  );
}
