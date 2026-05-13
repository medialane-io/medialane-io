"use client";

import { PageContainer } from "@medialane/ui";

import { Hero } from "./hero";
import { CollectionsStrip } from "./collections-strip";
import { CreatorsStrip } from "./creators-strip";
import { FeedSection } from "./feed-section";

export function DiscoverPage() {
  return (
    <PageContainer className="box-border max-w-full space-y-20">
      <Hero />
      <CollectionsStrip />
      <FeedSection />
      <CreatorsStrip />
    </PageContainer>
  );
}
