"use client";

import { ActivitiesFeed as SharedActivitiesFeed } from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";

export function ActivitiesFeed() {
  return <SharedActivitiesFeed getClient={getMedialaneClient} />;
}
