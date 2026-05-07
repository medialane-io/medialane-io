"use client";

import { PageContainer } from "@medialane/ui";

import { Hero } from "./hero";
import { CollectionsStrip } from "./collections-strip";
import { CreatorsStrip } from "./creators-strip";
import { FeedSection } from "./feed-section";

export function DiscoverPage() {
  return (
    <PageContainer className="space-y-10">
      <Hero />
      <CollectionsStrip />
      <FeedSection />
      <CreatorsStrip />
    </PageContainer>
  );
}
