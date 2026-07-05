"use client";

import { PageContainer } from "@medialane/ui";

import { Hero } from "./hero";
import { CollectionsStrip } from "./collections-strip";
import { CreatorsStrip } from "./creators-strip";
import { FeedSection } from "./feed-section";
import { IpTypeNav } from "./ip-type-nav";
import { CommunitySection } from "./community-section";

// Note: TopCreatorsRail (a second "top by XP" leaderboard) was dropped from
// this page — CommunitySection's right column already covers that job, and
// having both stacked back-to-back was pure repetition. Ported from
// medialane-starknet (2026-07-05).
export function DiscoverPage() {
  return (
    <PageContainer className="box-border max-w-full space-y-14 sm:space-y-20 px-4 sm:px-5 lg:px-6">
      <Hero />
      <CollectionsStrip />
      <FeedSection />
      <IpTypeNav />
      <CommunitySection />
      <CreatorsStrip />
    </PageContainer>
  );
}
