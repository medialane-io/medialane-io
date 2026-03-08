"use client";

import { Hero } from "./hero";
import { BentoSection } from "./bento-section";
import { FeedSection } from "./feed-section";

export function DiscoverPage() {
  return (
    <div className="space-y-10 pb-16">
      <Hero />
      <BentoSection />
      <FeedSection />
    </div>
  );
}
