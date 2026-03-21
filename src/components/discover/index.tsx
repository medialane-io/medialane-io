"use client";

import { Hero } from "./hero";
import { FeaturedCarousel } from "./featured-carousel";
import { CollectionsStrip } from "./collections-strip";
import { CreatorsStrip } from "./creators-strip";
import { FeedSection } from "./feed-section";

export function DiscoverPage() {
  return (
    <div className="pb-16 space-y-12">
      <Hero />
      <FeaturedCarousel />
      <CollectionsStrip />
      <CreatorsStrip />
      <FeedSection />
    </div>
  );
}
