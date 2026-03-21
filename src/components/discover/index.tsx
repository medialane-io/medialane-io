"use client";

import { FeaturedCarousel } from "./featured-carousel";
import { CollectionsStrip } from "./collections-strip";
import { CreatorsStrip } from "./creators-strip";
import { FeedSection } from "./feed-section";

export function DiscoverPage() {
  return (
    <div className="pb-16 space-y-12 px-4 sm:px-6 lg:px-8 pt-6">
      <FeaturedCarousel />
      <CollectionsStrip />
      <CreatorsStrip />
      <FeedSection />
    </div>
  );
}
