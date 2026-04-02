"use client";

import { HeroSlider } from "./hero-slider";
import { AirdropSection } from "./airdrop-section";
import { TrendingCollections } from "./trending-collections";
import { NewOnMarketplace } from "./new-on-marketplace";
import { LearnDocsCta } from "./learn-docs-cta";
import { ActivityTicker } from "@/components/shared/activity-ticker";

export function HomePage() {
  return (
    <div className="pb-20">
      {/* Hero — full-bleed collection slider */}
      <HeroSlider />

      {/* Live market ticker */}
      <div className="container mx-auto px-4 sm:px-6 pt-6">
        <ActivityTicker limit={14} />
      </div>

      {/* Platform features showcase */}
      <AirdropSection />

      {/* Padded content sections */}
      <div className="container mx-auto px-4 sm:px-6 space-y-20 mt-20">
        <TrendingCollections />
        <NewOnMarketplace />
        <LearnDocsCta />
      </div>
    </div>
  );
}
