"use client";

import { Hero } from "./hero";
import { CollectionsStrip } from "./collections-strip";
import { CreatorsStrip } from "./creators-strip";
import { FeedSection } from "./feed-section";

export function DiscoverPage() {
  return (
    <div className="container mx-auto px-4 pt-10 pb-16 space-y-10">
      <Hero />
      <CollectionsStrip />
      <CreatorsStrip />
      <FeedSection />
    </div>
  );
}
